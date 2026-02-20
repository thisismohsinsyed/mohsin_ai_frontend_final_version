export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import referencePromptData from "@/data/referencePrompt.json";
import { traceCallStatus } from "@/lib/ai-tools/callStatusTracer";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_TEXT_LENGTH = 12000;
const MAX_SCRIPT_ADDENDUM_CHARS = 400;
const MODEL_FALLBACK = process.env.SCRIPT_TEMPLATE_MODEL || "gemini-2.0-flash";

const FIXED_INITIAL_SENTENCE = "Hello, my name is Alicia your digital assistant. I'm here to ask you a few quick questions to see if you qualify for a free and thorough consultation.   May I ask who I am speaking with today?";

const cachedReferencePrompt = referencePromptData?.systemPrompt?.toString().trim() || null;

async function loadReferencePrompt() {
  if (cachedReferencePrompt) {
    return cachedReferencePrompt;
  }
  throw new Error("Reference prompt configuration is missing or invalid.");
}

function composeSystemPrompt(referencePrompt, scriptAddendum) {
  const base = referencePrompt?.toString().trim() || "";
  const additional = scriptAddendum?.toString().trim();
  if (!additional) return base;
  return `${base}\n\nADDITIONAL CONTEXT FROM SCRIPT:\n${additional.slice(0, MAX_SCRIPT_ADDENDUM_CHARS)}`;
}

async function runAiSummarizer(scriptText, referencePrompt) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const truncated = scriptText.slice(0, MAX_TEXT_LENGTH);
  const trimmedReference = referencePrompt?.toString().trim() || "";
  const prompt = `You are an expert AI assistant builder for Summit Tax Relief. The agent, Alicia, follows a specific five-step qualification flow.

REFERENCE FLOW (fixed baseline):
${trimmedReference}

Your task is to analyze the provided CALLER SCRIPT and extract ONLY specific nuances (tone, niche tax problems, specific urgency cues) that should be added to Alicia's context. return JSON with:
- "initialSentence": the fixed Alicia greeting: "Hello, my name is Alicia your digital assistant. I'm here to ask you a few quick questions to see if you qualify for a free and thorough consultation. May I ask who I am speaking with today?"
- "scriptAddendum": <= 100 words of specific instructions for Alicia based on the script (e.g., "The caller is often frustrated about wage garnishments, prioritize empathy on that.")

CALLER SCRIPT:
"""${truncated}"""`;

  const model = google(MODEL_FALLBACK);
  const { text: aiText } = await generateText({
    model,
    prompt,
    temperature: 0.4,
    maxOutputTokens: 500,
  });

  const rawContent = aiText || "";
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Unable to parse AI response");
  }

  const data = JSON.parse(jsonMatch[0]);
  const initialSentence = data.initialSentence?.toString().trim();
  const scriptAddendum = data.scriptAddendum?.toString().trim() || data.scriptContext?.toString().trim();
  if (!initialSentence) {
    throw new Error("AI response missing fields");
  }

  return {
    initialSentence,
    systemPrompt: composeSystemPrompt(referencePrompt, scriptAddendum || ""),
  };
}

function buildMetadataFallback({ notes, templateLabel, fileName }) {
  const parts = [];
  if (templateLabel) parts.push("Template label: " + templateLabel + ".");
  if (fileName) parts.push("Source file: " + fileName + ".");
  if (notes) parts.push("User notes: " + notes + ".");
  if (!parts.length) {
    return "No readable script text was extracted; rely on the reference prompt without extra adjustments.";
  }
  return "No readable script text was extracted. Use these metadata cues: " + parts.join(" ");
}

function buildFallback(scriptText, referencePrompt) {
  const normalized = scriptText.replace(/\s+/g, " ").trim();
  const fallbackAddendum = "Align to this script summary: " + normalized.slice(0, 600) + "... Keep responses confident, procedural, and compliant.";
  return { initialSentence: FIXED_INITIAL_SENTENCE, systemPrompt: composeSystemPrompt(referencePrompt, fallbackAddendum) };
}

async function runAiSafely(scriptText, referencePrompt) {
  try {
    const aiResult = await runAiSummarizer(scriptText, referencePrompt);
    if (aiResult) return aiResult;
  } catch (error) {
    console.warn("AI summarizer failed, using fallback", error);
  }
  return buildFallback(scriptText, referencePrompt);
}

async function extractTextWithPdfJs(buffer) {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = undefined;
    }
    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      verbosity: 0,
      stopAtErrors: true
    });
    const pdf = await loadingTask.promise;
    const chunks = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      try {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        chunks.push(pageText);
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNumber}`, pageError);
      }
    }
    if (pdf.cleanup) await pdf.cleanup();
    if (pdf.destroy) await pdf.destroy();
    return chunks.join("\n").trim();
  } catch (error) {
    console.error("PDF.js critical failure:", error);
    return "";
  }
}

async function extractScriptText(buffer) {
  try {
    const parsed = await pdfParse(buffer);
    const primaryText = parsed?.text?.trim();
    if (primaryText) return primaryText;
  } catch (error) {
    console.warn("Primary PDF parse failed", error);
  }
  return extractTextWithPdfJs(buffer);
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const templateName = (formData.get("name") || "Uploaded Script").toString().trim();
    const notes = (formData.get("notes") || "").toString().trim();

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    const lowerName = file.name?.toLowerCase() || "";
    if (
      !lowerName.endsWith(".pdf") &&
      !lowerName.endsWith(".txt") &&
      !lowerName.endsWith(".md") &&
      !lowerName.endsWith(".docx")
    ) {
      return NextResponse.json(
        { error: "Only .txt, .md, .docx, and .pdf files are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 8MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let scriptText = "";

    if (lowerName.endsWith(".pdf")) {
      scriptText = await extractScriptText(buffer);
    } else if (lowerName.endsWith(".docx")) {
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        scriptText = value;
      } catch (err) {
        console.error("DOCX extraction failed", err);
      }
    } else {
      scriptText = buffer.toString("utf-8");
    }

    if (scriptText) scriptText = scriptText.trim();

    if (!scriptText) {
      console.log("No text extracted from file, using metadata fallback.");
      scriptText = buildMetadataFallback({
        notes: notes || undefined,
        templateLabel: templateName || undefined,
        fileName: file.name || undefined,
      });
    }

    const referencePrompt = await loadReferencePrompt();
    const aiResult = await runAiSafely(scriptText, referencePrompt);
    const callTrace = await traceCallStatus(scriptText, {
      templateName,
      notes: notes || undefined,
      fileName: file.name || undefined,
    });

    const createdTemplate = await prisma.scriptTemplate.create({
      data: {
        label: templateName || "Uploaded Script",
        description: notes || ("Generated from " + (file.name || "uploaded file")),
        notes: notes || null,
        sourceFileName: file.name || null,
        initialSentence: FIXED_INITIAL_SENTENCE,
        systemPrompt: aiResult.systemPrompt,
      },
    });

    const enrichedTemplate = { ...createdTemplate, callTrace };
    return NextResponse.json({ template: enrichedTemplate });
  } catch (error) {
    console.error("Failed to process uploaded script", error);
    return NextResponse.json({ error: error.message || "Failed to process script." }, { status: 500 });
  }
}

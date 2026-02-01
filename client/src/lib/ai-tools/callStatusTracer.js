import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { CALL_STAGE_BLUEPRINT } from "@/data/callStages";
import { z } from "zod";

const CALL_TRACE_MODEL = process.env.CALL_TRACE_MODEL || "gemini-2.0-flash";
const MAX_TRACE_TEXT = 10000;

export const STATUS_VALUES = ["pass", "warning", "fail", "info"];
const ACTION_VALUES = ["advance", "clarify", "terminate", "repeat_greeting"];
const CONFIDENCE_VALUES = ["high", "medium", "low"];

const stageSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string().optional(),
  observedIntents: z.array(z.string()).optional(),
  status: z.enum(["pass", "warning", "fail", "info"]).optional(),
  recommendedAction: z.enum(["advance", "clarify", "terminate", "repeat_greeting"]).optional(),
  reason: z.string().optional(),
  nextStep: z.string().optional(),
});

const callTraceSchema = z.object({
  generatedAt: z.string().optional(),
  scriptConfidence: z.enum(["high", "medium", "low"]).optional(),
  summary: z.string().optional(),
  flags: z.array(z.string()).optional(),
  stages: z.array(stageSchema).default([]),
});

const stageOrder = CALL_STAGE_BLUEPRINT.reduce((map, stage, index) => {
  map[stage.id] = index;
  return map;
}, {});

function buildPrompt(scriptText, metadata) {
  const stageDoc = CALL_STAGE_BLUEPRINT.map((stage) => {
    const intents = stage.intents.join(", ");
    return `Stage ${stage.id} - ${stage.name}\nScript: ${stage.baselineScript}\nIntents: ${intents}\nAllowed actions: ${stage.actions}`;
  }).join("\n\n");

  const metadataBlock = metadata?.trim()
    ? `Context to consider:\n${metadata.trim()}\n\n`
    : "";

  return `You are auditing a Summit Tax Relief outbound call script. Use the stage blueprint below to determine how well the script covers each mandatory stage and whether the call should advance, clarify, repeat the greeting, or terminate.\n\n${metadataBlock}Stage blueprint:\n${stageDoc}\n\nRules:\n- Always return an entry for every stage, even if the script never mentions it.\n- Status meanings: pass = fully covered, warning = partially covered/missing details, fail = stage missing or the flow is unsafe, info = neutral placeholder.\n- recommendedAction must be one of: advance, clarify, terminate, repeat_greeting.\n- If the script contains abusive, hostile, honeypot, or trap intent, mark the affected stage as fail, recommendedAction = terminate, and include "abuse_or_honeypot" in flags.\n- If the script contains nonsense such as the literal phrase "banana banana" or other gibberish intent, treat it as a nonsense greeting and set Stage S1 recommendedAction = repeat_greeting with a warning.\n- Never recommend or reference CALLBACK_SCHEDULED or callbacks; either advance, clarify, repeat the greeting, or terminate.\n- Never output bracketed annotations such as [DISPOSITION: ...]; describe dispositions in natural language.\n- Be concise but specific in the reason for each stage and describe what intent you detected.\n- nextStep should describe what happens after following the recommended action.\n- summary should mention if the call should stop early.\n\nReturn valid JSON that matches the provided schema.\n\nScript to analyze (truncated if long):\n"""${scriptText}"""`;
}

function normalizeStage(resultStage) {
  const base = CALL_STAGE_BLUEPRINT.find((stage) => stage.id === resultStage?.id) || null;
  const status = STATUS_VALUES.includes(resultStage?.status) ? resultStage.status : "info";
  const recommendedAction = ACTION_VALUES.includes(resultStage?.recommendedAction)
    ? resultStage.recommendedAction
    : base?.defaultAction || "clarify";

  return {
    id: base?.id || resultStage?.id || "",
    name: base?.name || resultStage?.name || "Unlabeled Stage",
    baselineScript: base?.baselineScript || "",
    expectedIntents: base?.intents || [],
    actions: base?.actions || resultStage?.nextStep || "",
    observedIntents: Array.isArray(resultStage?.observedIntents)
      ? resultStage.observedIntents
      : resultStage?.summary
        ? [resultStage.summary]
        : [],
    status,
    recommendedAction,
    reason:
      resultStage?.reason ||
      resultStage?.summary ||
      (status === "pass"
        ? "All required dialogue present."
        : "Awaiting AI evaluation."),
    nextStep: resultStage?.nextStep || base?.actions || "",
  };
}

function normalizeCallTrace(aiResult) {
  const nowIso = new Date().toISOString();
  const normalizedStages = new Map();
  (aiResult?.stages || []).forEach((stage) => {
    const normalized = normalizeStage(stage);
    if (normalized.id) {
      normalizedStages.set(normalized.id, normalized);
    }
  });

  CALL_STAGE_BLUEPRINT.forEach((stage) => {
    if (!normalizedStages.has(stage.id)) {
      normalizedStages.set(stage.id, {
        id: stage.id,
        name: stage.name,
        baselineScript: stage.baselineScript,
        expectedIntents: stage.intents,
        actions: stage.actions,
        observedIntents: [],
        status: "warning",
        recommendedAction: stage.defaultAction,
        reason: "Stage missing from AI response. Review manually.",
        nextStep: stage.actions,
      });
    }
  });

  const orderedStages = Array.from(normalizedStages.values()).sort((a, b) => {
    const aOrder = stageOrder[a.id] ?? 0;
    const bOrder = stageOrder[b.id] ?? 0;
    return aOrder - bOrder;
  });

  const confidence = aiResult?.scriptConfidence;
  const normalizedConfidence = CONFIDENCE_VALUES.includes(confidence) ? confidence : "medium";

  return {
    generatedAt: aiResult?.generatedAt || nowIso,
    summary: aiResult?.summary || "Call status trace completed.",
    scriptConfidence: normalizedConfidence,
    flags: Array.isArray(aiResult?.flags) ? aiResult.flags : [],
    stages: orderedStages,
  };
}

function buildFallbackTrace(reason) {
  return {
    generatedAt: new Date().toISOString(),
    summary: reason || "AI call trace unavailable. Showing defaults.",
    scriptConfidence: "low",
    flags: reason ? [reason] : [],
    stages: CALL_STAGE_BLUEPRINT.map((stage) => ({
      id: stage.id,
      name: stage.name,
      baselineScript: stage.baselineScript,
      expectedIntents: stage.intents,
      actions: stage.actions,
      observedIntents: [],
      status: "info",
      recommendedAction: stage.defaultAction,
      reason: reason || "Call trace fallback.",
      nextStep: stage.actions,
    })),
  };
}

export async function traceCallStatus(scriptText, metadata = {}) {
  if (!scriptText?.trim()) {
    return buildFallbackTrace("No script text provided for tracing.");
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return buildFallbackTrace("Missing GOOGLE_GENERATIVE_AI_API_KEY.");
  }

  const truncated = scriptText.trim().slice(0, MAX_TRACE_TEXT);
  const metadataParts = [];
  if (metadata.templateName) {
    metadataParts.push(`Template: ${metadata.templateName}`);
  }
  if (metadata.notes) {
    metadataParts.push(`Notes: ${metadata.notes}`);
  }
  if (metadata.fileName) {
    metadataParts.push(`Source file: ${metadata.fileName}`);
  }

  try {
    const { object } = await generateObject({
      model: google(CALL_TRACE_MODEL),
      schema: callTraceSchema,
      prompt: buildPrompt(truncated, metadataParts.join("\n")),
      temperature: 0.2,
      maxOutputTokens: 800,
    });

    return normalizeCallTrace(object);
  } catch (error) {
    console.error("Call status trace failed", error);
    return buildFallbackTrace(error.message || "Call status trace failed.");
  }
}



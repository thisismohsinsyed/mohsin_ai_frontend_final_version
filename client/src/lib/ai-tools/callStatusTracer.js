import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { CALL_STAGE_BLUEPRINT } from "@/data/callStages";
import { z } from "zod";

const CALL_TRACE_MODEL = process.env.CALL_TRACE_MODEL || "gemini-1.5-pro";
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

  return `${metadataBlock}Stage blueprint:\n${stageDoc}`;
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
      model: google("gemini-2.0-flash"),
      schema: callTraceSchema,
      prompt: `TASK: Extract compliance status for the call script below.
${metadataParts.join("\n")}

STAGES TO VERIFY:
${buildPrompt(truncated, "").replace(/Stage blueprint:\n/, "")}

INSTRUCTIONS:
1. For each stage, check if the script matches the intent.
2. Return JSON.
3. Keep summaries under 10 words.
4. NO REPETITION.

Script:
"""${truncated}"""`,
      temperature: 0.0,
      maxOutputTokens: 8192,
    });

    return normalizeCallTrace(object);
  } catch (error) {
    console.error("Call status trace failed", error);
    return buildFallbackTrace(error.message || "Call status trace failed.");
  }
}



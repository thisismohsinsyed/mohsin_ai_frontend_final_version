export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { traceCallStatus } from "@/lib/ai-tools/callStatusTracer";

function buildMetadata(payload = {}) {
  const metadata = {};
  if (payload.templateName) {
    metadata.templateName = payload.templateName.toString().trim();
  }
  if (payload.notes) {
    metadata.notes = payload.notes.toString().trim();
  }
  if (payload.fileName) {
    metadata.fileName = payload.fileName.toString().trim();
  }
  return metadata;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const transcript = body?.transcript;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json({ error: "Transcript text is required." }, { status: 400 });
    }

    const trace = await traceCallStatus(transcript, buildMetadata(body));
    return NextResponse.json({ trace });
  } catch (error) {
    console.error("Failed to trace live call", error);
    return NextResponse.json(
      { error: error.message || "Unable to update call status trace." },
      { status: 500 }
    );
  }
}

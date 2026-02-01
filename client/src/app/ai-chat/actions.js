"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function askGemini(message) {
  const model = google("gemini-2.5-flash");

  const { text } = await generateText({
    model,
    prompt: message,
  });

  return text;
}

export const runtime = "nodejs"; // ✅ ensure Node runtime (not Edge)
export const dynamic = "force-dynamic"; // optional, avoids caching issues

import { NextResponse } from "next/server";
import OpenAI from "openai";

// ✅ Higgs Audio / vLLM-compatible API
const client = new OpenAI({
  apiKey: process.env.HIGGS_API_KEY || "YOUR_API_KEY",
  baseURL: "http://173.208.243.146:7000/v1", // keep HTTP (safe via server)
});

export async function POST(req) {
  try {
    const { audioUrl, textUrl, text } = await req.json();

    if (!audioUrl || !textUrl || !text) {
      return NextResponse.json(
        { error: "Missing fields: audioUrl, textUrl, and text are required." },
        { status: 400 }
      );
    }

    // 🧩 Download both reference files safely
    const [audioRes, textRes] = await Promise.all([
      fetch(audioUrl, { cache: "no-store" }),
      fetch(textUrl, { cache: "no-store" }),
    ]);

    if (!audioRes.ok || !textRes.ok) {
      throw new Error("Failed to fetch audio or text file from provided URLs");
    }

    // ✅ Fully read data before use
    const audioArrayBuffer = await audioRes.arrayBuffer();
    const transcript = await textRes.text();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString("base64");

    // 🧠 Multimodal payload
    const messages = [
      { role: "user", content: transcript },
      {
        role: "assistant",
        content: [
          { type: "input_audio", input_audio: { data: audioBase64, format: "wav" } },
        ],
      },
      { role: "user", content: text },
    ];

    // 🔮 Run inference
    const completion = await client.chat.completions.create({
      model: "higgs-audio-v2-generation-3B-base",
      messages,
      modalities: ["text", "audio"],
      temperature: 1.0,
      top_p: 0.95,
      max_completion_tokens: 500,
      extra_body: { top_k: 50 },
      stop: ["<|eot_id|>", "<|end_of_text|>", "<|audio_eos|>"],
    });

    const audioBase64Output = completion?.choices?.[0]?.message?.audio?.data;
    if (!audioBase64Output) throw new Error("No audio data returned from model");

    // 🎧 Safe buffer copy to avoid locked-body bug
    const audioOutBuffer = Buffer.from(audioBase64Output, "base64");
    const outputCopy = new Uint8Array(audioOutBuffer);

    // 🧾 Return downloadable WAV
    return new Response(outputCopy, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'attachment; filename="cloned_voice.wav"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("❌ Error generating cloned voice:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

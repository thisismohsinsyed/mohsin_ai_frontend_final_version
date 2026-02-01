import OpenAI from "openai";
import fetch from "node-fetch"; // if using Node <18, otherwise global fetch is fine

// ✅ Higgs Audio client
const client = new OpenAI({
  apiKey: process.env.HIGGS_API_KEY || "YOUR_API_KEY",
  baseURL: "http://173.208.243.146:7000/v1", // HTTP is fine for server-side
});

export const cloneVoice = async (req, res, next) => {
  try {
    const { audioUrl, textUrl, text } = req.body;

    if (!audioUrl || !textUrl || !text) {
      return res.status(400).json({ error: "Missing fields: audioUrl, textUrl, and text are required." });
    }

    // 🧩 Download reference files
    const [audioRes, textRes] = await Promise.all([
      fetch(audioUrl, { cache: "no-store" }),
      fetch(textUrl, { cache: "no-store" }),
    ]);

    if (!audioRes.ok || !textRes.ok) {
      throw new Error("Failed to fetch audio or text file from provided URLs");
    }

    const audioArrayBuffer = await audioRes.arrayBuffer();
    const transcript = await textRes.text();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString("base64");

    // 🧠 Construct multimodal payload
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

    // 🔮 Call Higgs Audio / vLLM
    const completion = await client.chat.completions.create({
      model: "higgs-audio-v2-generation-3B-base",
      messages,
      stream: false,
      modalities: ["text", "audio"],
      temperature: 1.0,
      top_p: 0.95,
      max_completion_tokens: 1024,
      extra_body: { top_k: 50 },
      stop: ["<|eot_id|>", "<|end_of_text|>", "<|audio_eos|>"],
    });

    const audioBase64Output = completion?.choices?.[0]?.message?.audio?.data;

    if (!audioBase64Output) throw new Error("No audio data returned from model");

    const audioBuffer = Buffer.from(audioBase64Output, "base64");
    const outputCopy = new Uint8Array(audioBuffer);

    // 🎵 Return as downloadable WAV
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Disposition", 'attachment; filename="cloned_voice.wav"');
    res.setHeader("Cache-Control", "no-store");
    return res.send(outputCopy);
  } catch (err) {
    console.error("❌ Error generating cloned voice:", err);
    next(err); // pass to error middleware
  }
};

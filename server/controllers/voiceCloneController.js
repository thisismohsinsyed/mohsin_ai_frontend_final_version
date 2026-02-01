import OpenAI from "openai";
import fetch from "node-fetch"; // Needed if Node <18
import WavDecoder from "wav-decoder";
import WavEncoder from "wav-encoder";

// ✅ Higgs Audio client
const client = new OpenAI({
  apiKey: process.env.HIGGS_API_KEY || "YOUR_API_KEY",
  baseURL: "http://173.208.243.146:7000/v1",
});

function chunkText(text, maxChars = 250) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars) {
      chunks.push(current.trim());
      current = sentence + " ";
    } else {
      current += sentence + " ";
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function concatenateWavs(buffers, silenceMs = 100) {
  const decoded = await Promise.all(buffers.map(b => WavDecoder.decode(b)));
  const { sampleRate, channelData: first } = decoded[0];
  const numChannels = first.length;
  const silenceSamples = Math.floor((silenceMs / 1000) * sampleRate);

  const mergedChannels = Array.from({ length: numChannels }, (_, ch) => {
    const totalLength =
      decoded.reduce((acc, d) => acc + d.channelData[ch].length, 0) +
      silenceSamples * (decoded.length - 1);

    const merged = new Float32Array(totalLength);
    let offset = 0;

    for (let i = 0; i < decoded.length; i++) {
      const chunk = decoded[i].channelData[ch];
      merged.set(chunk, offset);
      offset += chunk.length;
      if (i < decoded.length - 1 && silenceSamples > 0) {
        offset += silenceSamples;
      }
    }

    return merged;
  });

  const mergedWav = await WavEncoder.encode({
    sampleRate,
    channelData: mergedChannels,
  });
  return Buffer.from(mergedWav);
}

async function generateAudioSegment({ transcript, audioBase64, chunk, index }) {
  console.log(`🎙️ Generating chunk ${index + 1}...`);

  const completion = await client.chat.completions.create({
    model: "higgs-audio-v2-generation-3B-base",
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text:
              "Generate audio following instruction.\n\n<|scene_desc_start|>\nAudio is recorded from a quiet room.\nTranscript: " + transcript + "\n<|scene_desc_end|>"
          },
          { type: "input_audio", input_audio: { data: audioBase64, format: "wav" } }
        ]
      },
      { role: "user", content: chunk }
    ],
    stream: false,
    modalities: ["text", "audio"],
    temperature: 0.3,
    top_p: 0.95,
    max_completion_tokens: 1024,
    extra_body: { top_k: 50 },
    stop: ["<|eot_id|>", "<|end_of_text|>", "<|audio_eos|>"]
  });

  const audioBase64Output = completion?.choices?.[0]?.message?.audio?.data;
  if (!audioBase64Output) throw new Error(`No audio data returned for chunk ${index + 1}`);

  const audioBuffer = Buffer.from(audioBase64Output, "base64");
  return { index, buffer: audioBuffer };
}

export const cloneVoice = async (req, res, next) => {
  try {
    const { audioUrl, textUrl, text } = req.body;

    if (!audioUrl || !textUrl || !text) {
      return res.status(400).json({ error: "Missing fields: audioUrl, textUrl, and text are required." });
    }

    const [audioRes, textRes] = await Promise.all([
      fetch(audioUrl, { cache: "no-store" }),
      fetch(textUrl, { cache: "no-store" })
    ]);

    if (!audioRes.ok || !textRes.ok) {
      throw new Error("Failed to fetch audio or text file from provided URLs");
    }

    const audioArrayBuffer = await audioRes.arrayBuffer();
    const transcript = await textRes.text();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString("base64");

    const textChunks = chunkText(text, 250);
    console.log(`🧠 Generating ${textChunks.length} chunks in parallel...`);

    const results = await Promise.allSettled(
      textChunks.map((chunk, i) =>
        generateAudioSegment({ transcript, audioBase64, chunk, index: i })
      )
    );

    const fulfilled = results
      .filter(r => r.status === "fulfilled")
      .map(r => r.value)
      .sort((a, b) => a.index - b.index);

    if (fulfilled.length === 0) {
      throw new Error("All audio chunk generations failed.");
    }

    const audioBuffers = fulfilled.map(f => f.buffer);

    console.log(`🔗 Concatenating ${audioBuffers.length} successful segments...`);
    const mergedAudio = await concatenateWavs(audioBuffers, 100);

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Disposition", 'attachment; filename="cloned_voice.wav"');
    res.setHeader("Cache-Control", "no-store");
    return res.send(mergedAudio);

  } catch (err) {
    console.error("❌ Error generating cloned voice:", err);
    next(err);
  }
};

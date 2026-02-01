import fs from "fs";
import wav from "node-wav";

/**
 * Read WAV file and convert the first channel to PCM16 Int16Array.
 * Ensures raw PCM16 without WAV header.
 * 
 * @param {string} filePath - Path to WAV file
 * @returns {Int16Array} PCM16 audio data for the first channel
 * @throws Will throw an error if file does not exist or no channels found
 */
export function readWavAsPCM16(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const buffer = fs.readFileSync(filePath);
  const decoded = wav.decode(buffer);

  if (decoded.channelData.length < 1) throw new Error("No channels found in WAV");

  const channel = decoded.channelData[0];
  const int16 = new Int16Array(channel.length);

  for (let i = 0; i < channel.length; i++) {
    // Clamp to Int16 range [-32768, 32767]
    int16[i] = Math.max(-32768, Math.min(32767, Math.round(channel[i] * 32767)));
  }

  return int16;
}

/**
 * Convert an Int16Array to raw PCM16 Buffer (no WAV header)
 * Used to send to Triton Whisper or any ASR expecting PCM16LE
 * 
 * @param {Int16Array} int16Array
 * @returns {Buffer} Raw PCM16 buffer
 */
export function int16ToBuffer(int16Array) {
  return Buffer.from(int16Array.buffer);
}

/**
 * Split PCM16 buffer into chunks suitable for Whisper Triton model.
 * Ensures no chunk exceeds chunkDuration seconds to prevent >3000 mel features error.
 * Default safe chunkDuration is 20s for Whisper Lite.
 * 
 * @param {Buffer} audioBuffer - PCM16 buffer
 * @param {number} chunkDuration - Duration per chunk in seconds (default 20s)
 * @param {number} sampleRate - Sample rate in Hz (default 16kHz)
 * @returns {Buffer[]} Array of PCM16 chunks
 */
export function splitAudioBuffer(audioBuffer, chunkDuration = 20, sampleRate = 16000) {
  const bytesPerSample = 2; // PCM16
  const maxSamples = chunkDuration * sampleRate;
  const chunkBytes = maxSamples * bytesPerSample;

  const chunks = [];
  for (let i = 0; i < audioBuffer.length; i += chunkBytes) {
    const chunk = audioBuffer.slice(i, Math.min(i + chunkBytes, audioBuffer.length));
    chunks.push(chunk);

    const actualSeconds = chunk.length / bytesPerSample / sampleRate;
    console.log(`Chunk created: ${actualSeconds.toFixed(2)} seconds`);
  }

  return chunks;
}

/**
 * Transcribe a PCM16 Buffer in chunks using Triton Whisper.
 * 
 * @param {Buffer} audioBuffer - PCM16 buffer
 * @param {TranscribeAudioClient} tritonClient - Triton client instance
 * @param {number} chunkDuration - Duration per chunk in seconds (default 20)
 * @returns {Promise<string[]>} Array of transcriptions per chunk
 */
export async function transcribeInChunks(audioBuffer, tritonClient, chunkDuration = 20) {
  const chunks = splitAudioBuffer(audioBuffer, chunkDuration);
  const transcriptions = [];

  for (const chunk of chunks) {
    const text = await tritonClient.infer(chunk);
    transcriptions.push(text);
  }

  return transcriptions;
}

/**
 * Get full transcription string from PCM16 buffer using Triton Whisper.
 * Removes leading artifact character (like "7" or "E") if present.
 * Joins all chunk transcriptions into a single string.
 * 
 * @param {Buffer} audioBuffer - PCM16 buffer
 * @param {TranscribeAudioClient} tritonClient
 * @param {number} chunkDuration - Duration per chunk in seconds (default 20)
 * @returns {Promise<string>} Full transcription
 */
export async function getFullTranscription(audioBuffer, tritonClient, chunkDuration = 20) {
  let transcriptions = await transcribeInChunks(audioBuffer, tritonClient, chunkDuration);
  let fullText = transcriptions.join(" ").trim();

  // Remove leading artifact if present
  if (fullText.length > 0 && /^[7E]/.test(fullText[0])) {
    fullText = fullText.substring(1).trim();
  }

  return fullText;
}

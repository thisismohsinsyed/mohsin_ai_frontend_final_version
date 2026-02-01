import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateSlug } from "random-word-slugs";

/** Merge Tailwind + conditional classNames */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Downsample Float32 audio buffer to a target sample rate (e.g. 16 kHz) */
export const downsampleBuffer = (buffer, recordRate, targetRate) => {
  if (targetRate === recordRate) return buffer;
  if (targetRate > recordRate)
    throw new Error("Target sample rate must be lower than recorded rate.");

  const ratio = recordRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffset = Math.round((offsetResult + 1) * ratio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffset && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult++] = accum / count;
    offsetBuffer = nextOffset;
  }
  return result;
};

/**
 * Convert an AudioBuffer → playable 16-bit PCM WAV Blob (mono @ 16 kHz)
 * ✅ Based on your proven working layout.
 */
export const audioBufferToWav = (buffer) => {
  // --- 1️⃣ Mix down to mono
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const tmp = new Float32Array(length);
  for (let c = 0; c < numChannels; c++) {
    const chan = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) tmp[i] += chan[i];
  }
  for (let i = 0; i < length; i++) tmp[i] /= numChannels;

  // --- 2️⃣ Downsample to 16 kHz
  const resampled = downsampleBuffer(tmp, buffer.sampleRate, 16000);

  // --- 3️⃣ Build WAV header + data (same proven layout)
  const sampleRate = 16000;
  const numOfChan = 1;
  const bytesPerSample = 2;
  const dataLength = resampled.length * numOfChan * bytesPerSample;
  const totalLength = dataLength + 44;
  const abuffer = new ArrayBuffer(totalLength);
  const view = new DataView(abuffer);
  let pos = 0;

  const writeString = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(pos++, s.charCodeAt(i)); };

  writeString("RIFF");
  view.setUint32(pos, totalLength - 8, true); pos += 4;
  writeString("WAVE");
  writeString("fmt "); 
  view.setUint32(pos, 16, true); pos += 4;
  view.setUint16(pos, 1, true); pos += 2;            // PCM format
  view.setUint16(pos, numOfChan, true); pos += 2;    // Mono
  view.setUint32(pos, sampleRate, true); pos += 4;   // Sample rate
  view.setUint32(pos, sampleRate * numOfChan * bytesPerSample, true); pos += 4; // Byte rate
  view.setUint16(pos, numOfChan * bytesPerSample, true); pos += 2;              // Block align
  view.setUint16(pos, 16, true); pos += 2;            // Bits per sample
  writeString("data");
  view.setUint32(pos, dataLength, true); pos += 4;

  // --- 4️⃣ Write PCM samples
  for (let i = 0; i < resampled.length; i++) {
    const s = Math.max(-1, Math.min(1, resampled[i]));
    view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    pos += 2;
  }

  return new Blob([view], { type: "audio/wav" });
};

/** Generate a clean, readable, random WAV file name. */
export function generateAudioFileName() {
  const slug = generateSlug(2, { format: "kebab" });
  return `${slug}.wav`;
}

/** Sanitize any provided filename. */
export function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-\.]/g, "");
}

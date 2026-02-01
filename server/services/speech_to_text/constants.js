// constants.js
export const SAMPLE_RATE = 8000;          // Input mic sample rate (Hz)
export const FRAME_DURATION_MS = 40;      // Each audio frame duration in ms
export const BYTES_PER_SAMPLE = 2;        // int16 = 2 bytes
export const FRAME_SAMPLES = SAMPLE_RATE * (FRAME_DURATION_MS / 1000);
export const FRAME_BYTES = FRAME_SAMPLES * BYTES_PER_SAMPLE;

export const OUTPUT_SAMPLE_RATE = 16000;  // Output audio sample rate (Hz)
export const OUTPUT_CHUNK_MS = 50;        // Duration per output chunk in ms
export const OUTPUT_CHUNK_SAMPLES = OUTPUT_SAMPLE_RATE * (OUTPUT_CHUNK_MS / 1000);
export const OUTPUT_CHUNK_BYTES = OUTPUT_CHUNK_SAMPLES * BYTES_PER_SAMPLE;

export const MODEL_NAME = "streaming_stt"; // Triton ASR model name

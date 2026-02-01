import streamBuffers from "stream-buffers";

/**
 * Create a writable stream buffer for audio data
 * @param {number} initialSize - Initial size in bytes
 * @param {number} incrementAmount - Increment step size in bytes
 * @returns {WritableStreamBuffer} instance
 */
export function createAudioBuffer(initialSize = 100 * 1024, incrementAmount = 10 * 1024) {
  return new streamBuffers.WritableStreamBuffer({
    initialSize,
    incrementAmount,
  });
}

/**
 * Pad a buffer with zeros to a target length
 * @param {Buffer} buf - original buffer
 * @param {number} targetLength - desired length in bytes
 * @returns {Buffer} padded buffer
 */
export function padBuffer(buf, targetLength) {
  if (buf.length >= targetLength) return buf;
  const padded = Buffer.alloc(targetLength);
  buf.copy(padded, 0, 0, buf.length);
  return padded;
}

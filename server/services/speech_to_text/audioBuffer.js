import streamBuffers from "stream-buffers";

/**
 * Audio buffer wrapper for managing streaming chunks
 */
export class AudioBuffer {
  /**
   * @param {number} initialSize
   * @param {number} incrementAmount
   */
  constructor(initialSize = 100 * 1024, incrementAmount = 10 * 1024) {
    this.buffer = new streamBuffers.WritableStreamBuffer({
      initialSize,
      incrementAmount,
    });
  }

  /** Write raw audio bytes to buffer */
  write(chunk) {
    this.buffer.write(chunk);
  }

  /** Get N bytes from buffer */
  getContents(n) {
    return this.buffer.getContents(n);
  }

  /** Get current buffer size */
  size() {
    return this.buffer.size();
  }

  /** End buffer */
  end() {
    this.buffer.end();
  }

  /** Destroy buffer */
  destroy() {
    this.buffer.destroy();
  }
}

/** Pad buffer to target size with zeros */
export function padBuffer(buf, targetSize) {
  if (buf.length >= targetSize) return buf;
  const padded = Buffer.alloc(targetSize);
  buf.copy(padded);
  return padded;
}

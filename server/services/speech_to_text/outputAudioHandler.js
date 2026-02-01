import { padBuffer } from "./audioBuffer.js";
import { OUTPUT_CHUNK_BYTES } from "./constants.js";

/**
 * Handles output audio buffering and periodic flush to WebSocket.
 * Sends raw audio as ArrayBuffer, separately from transcription JSON.
 */
export class OutputAudioHandler {
  /**
   * @param {WebSocket} ws - WebSocket to send output audio to
   */
  constructor(ws) {
    this.audioBuffer = null; // Will be assigned from session
    this.ws = ws;
  }

  /** Assign the WritableStreamBuffer used for output audio */
  setBuffer(buffer) {
    this.audioBuffer = buffer;
  }

  /**
   * Flushes available audio every interval.
   * Sends a full chunk if available, or pads the last partial chunk to OUTPUT_CHUNK_BYTES.
   */
  flush() {
    if (!this.audioBuffer || this.audioBuffer.size() === 0) return;

    let chunkBuf = null;
    const bufferSize = this.audioBuffer.size();

    if (bufferSize >= OUTPUT_CHUNK_BYTES) {
      // Full chunk
      chunkBuf = this.audioBuffer.getContents(OUTPUT_CHUNK_BYTES);
    } else if (bufferSize > 0 && bufferSize < OUTPUT_CHUNK_BYTES) {
      // Partial chunk, pad with zeros
      const partialBuf = this.audioBuffer.getContents(bufferSize);
      chunkBuf = padBuffer(partialBuf, OUTPUT_CHUNK_BYTES);
    }

    if (chunkBuf) {
      // Send raw audio chunk as ArrayBuffer, NOT JSON
      if (this.ws.readyState === this.ws.OPEN) {
        this.ws.send(chunkBuf);
      }
    }
  }
}

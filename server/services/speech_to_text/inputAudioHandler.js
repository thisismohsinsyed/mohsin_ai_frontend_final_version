import { FRAME_BYTES } from "./constants.js"; // 8kHz, 40ms frame
/**
 * Handles input audio buffering and flushing
 */
export class InputAudioHandler {
  constructor(audioBuffer, tritonClient) {
    this.audioBuffer = audioBuffer;
    this.tritonClient = tritonClient;
  }

  /** Flush available 40ms audio chunks to Triton */
  flush() {
    if (this.audioBuffer.size() >= FRAME_BYTES) {
      const chunk = this.audioBuffer.getContents(FRAME_BYTES);
      if (chunk) this.tritonClient.streamCall.write(this.tritonClient.buildRequest(chunk, false, false));
    }
  }
}

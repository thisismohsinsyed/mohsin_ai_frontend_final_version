import * as dotenv from "dotenv";
dotenv.config();

import { AudioBuffer } from "./audioBuffer.js";
import TritonClient from "./TritonClient.js";
import { InputAudioHandler } from "./inputAudioHandler.js";
import { OutputAudioHandler } from "./outputAudioHandler.js";
import { FRAME_BYTES, FRAME_DURATION_MS, OUTPUT_CHUNK_MS } from "./constants.js";

export default class ASRStreamSession {
  constructor(
    uuid,
    caller,
    audioUrl,
    promptSettings = {},
    modelIp = process.env.MODEL_IP,
    modelPort = process.env.MODEL_PORT
  ) {
    this.uuid = uuid;
    this.caller = caller;
    this.promptSettings = promptSettings;
    const fallbackVoice = "en_woman.wav";
    this.fileName = audioUrl ? audioUrl.split("/").pop().split("?")[0] : fallbackVoice;

    this.inputAudioBuffer = new AudioBuffer();
    this.outputAudioBuffer = new AudioBuffer();

    this.triton = new TritonClient(
      modelIp,
      modelPort,
      this.fileName,
      "streaming_stt",
      promptSettings
    );

    this.inputHandler = new InputAudioHandler(this.inputAudioBuffer, this.triton);
    this.outputHandler = null;

    this.streamCall = null;
    this.writeInterval = null;
    this.flushOutputInterval = null;
  }

  _decodeTranscription(buf) {
    if (!buf) return null;
    const text = buf.length > 4 ? buf.slice(4).toString("utf8") : buf.toString("utf8");
    return text.trim() || null;
  }

  _handleGrpcResponse(ws, response) {
    const rawOutputs = response?.infer_response?.raw_output_contents ?? [];
    const meta = response?.infer_response?.outputs ?? [];

    const namedOutputs = {};
    meta.forEach((out, i) => {
      if (Buffer.isBuffer(rawOutputs[i])) namedOutputs[out.name] = rawOutputs[i];
    });

    const transcription = this._decodeTranscription(namedOutputs["transcription"]);
    const botResponse = this._decodeTranscription(namedOutputs["bot_response"]);
    const outputAudioChunk = namedOutputs["output_audio_chunk"];

    if (transcription && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ transcription }));
    }

    if (botResponse && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ bot_response: botResponse }));
    }

    if (outputAudioChunk && this.outputAudioBuffer) {
      this.outputAudioBuffer.write(outputAudioChunk);
    }
  }

  processWebSocket(ws) {
    this.outputHandler = new OutputAudioHandler(ws);
    this.outputHandler.setBuffer(this.outputAudioBuffer);

    this.triton.startStream();
    this.streamCall = this.triton.streamCall;
    this.streamCall.write(this.triton.buildRequest(Buffer.alloc(FRAME_BYTES), true, false));

    this.writeInterval = setInterval(() => this.inputHandler.flush(), FRAME_DURATION_MS);
    this.flushOutputInterval = setInterval(() => this.outputHandler.flush(), OUTPUT_CHUNK_MS);

    this.streamCall.on("data", (response) => this._handleGrpcResponse(ws, response));
    this.streamCall.on("error", async (err) => {
      console.error(err);
      await this.stop();
    });
    this.streamCall.on("end", async () => await this.stop());

    ws.on("message", (msg) => {
      const buffer = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
      this.inputAudioBuffer.write(buffer);
    });

    ws.on("close", async () => await this.stop());
  }

  async stop() {
    if (this.writeInterval) clearInterval(this.writeInterval);
    if (this.flushOutputInterval) clearInterval(this.flushOutputInterval);

    this.triton.endStream(Buffer.alloc(FRAME_BYTES));

    if (this.inputAudioBuffer) {
      this.inputAudioBuffer.end();
      this.inputAudioBuffer.destroy?.();
    }
    if (this.outputAudioBuffer) {
      this.outputAudioBuffer.end();
      this.outputAudioBuffer.destroy?.();
    }
  }
}

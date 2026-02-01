import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { generateUniqueSequenceId } from "../../utils/utils.js";

export default class TritonClient {
  constructor(modelIp, modelPort, fileName, modelName = "streaming_stt", promptSettings = {}) {
    const protoDefinition = protoLoader.loadSync("./protocol/grpc_service.proto", {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const GRPCServicePackageDefinition = grpc.loadPackageDefinition(protoDefinition);
    const inference = GRPCServicePackageDefinition.inference;

    this.client = new inference.GRPCInferenceService(
      `${modelIp}:${modelPort}`,
      grpc.credentials.createInsecure()
    );

    this.sequenceId = generateUniqueSequenceId();
    this.modelName = modelName;
    this.streamCall = null;
    this.fileName = fileName;
    this.promptSettings = promptSettings;
  }

  buildRequest(audioBuffer, start = false, end = false) {
    const parameters = {
      sequence_id: { int64_param: this.sequenceId },
      sequence_start: { bool_param: start },
      sequence_end: { bool_param: end },
      voice_name: { string_param: this.fileName.replace(".wav", "") || "en_woman" },
    };

    if (this.promptSettings?.systemPrompt) {
      parameters.system_prompt = { string_param: this.promptSettings.systemPrompt };
    }

    if (this.promptSettings?.initialSentence) {
      parameters.initial_sentence = { string_param: this.promptSettings.initialSentence };
    }

    return {
      model_name: this.modelName,
      inputs: [{ name: "audio_chunk", datatype: "INT16", shape: [audioBuffer.length / 2] }],
      outputs: [
        { name: "transcription" },
        { name: "bot_response" },
        { name: "output_audio_chunk" },
      ],
      raw_input_contents: [audioBuffer],
      parameters,
    };
  }

  startStream(metadata = new grpc.Metadata()) {
    this.streamCall = this.client.ModelStreamInfer(metadata, {});
  }

  endStream(finalChunk = Buffer.alloc(0)) {
    if (!this.streamCall) return;
    this.streamCall.write(this.buildRequest(finalChunk, false, true));
    this.streamCall.end();
    this.streamCall = null;
  }
}

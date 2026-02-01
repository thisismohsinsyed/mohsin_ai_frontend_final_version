import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

/**
 * Helper: Encode JS string → Triton BYTES tensor format
 * (adds 4-byte little-endian length prefix)
 */
function encodeTritonString(str) {
  const encoded = Buffer.from(str, "utf8");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32LE(encoded.length, 0);
  return Buffer.concat([lengthBuf, encoded]);
}

/**
 * Helper: Decode Triton BYTES tensor back to array of strings
 */
function decodeTritonStringTensor(buffer) {
  const results = [];
  let offset = 0;
  while (offset + 4 <= buffer.length) {
    const len = buffer.readUInt32LE(offset);
    offset += 4;
    const strBytes = buffer.slice(offset, offset + len);
    offset += len;
    results.push(strBytes.toString("utf8"));
  }
  return results;
}

/**
 * CloneVoiceUpdateClient
 * gRPC client for the Triton model "clone_voice_update"
 * 
 * Returns both:
 *   - list_of_voices (array)
 *   - transcription (string)
 */
export default class CloneVoiceUpdateClient {
  constructor(modelIp, modelPort = 9001, modelName = "clone_voice_update") {
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
    this.modelName = modelName;
  }

  /**
   * Send a single inference request with an audio URL
   * @param {string} audioUrl
   * @returns {Promise<{ voices: string[], transcription: string }>}
   */
  async infer(audioUrl = "") {
    return new Promise((resolve, reject) => {
      try {
        // ✅ Encode input (TYPE_STRING → BYTES)
        const encodedInput = encodeTritonString(audioUrl);

        const request = {
          model_name: this.modelName,
          inputs: [
            {
              name: "audio_url",
              datatype: "BYTES",
              shape: [1],
            },
          ],
          // ✅ Ask for both outputs
          outputs: [
            { name: "list_of_voices" },
            { name: "transcription" },
          ],
          raw_input_contents: [encodedInput],
        };

        this.client.ModelInfer(request, (err, response) => {
          if (err) return reject(err);

          try {
            const rawOutputs = response.raw_output_contents || [];
            if (rawOutputs.length < 2) {
              return reject(new Error("Missing outputs from Triton response."));
            }

            // ✅ Decode both outputs
            const voicesDecoded = decodeTritonStringTensor(rawOutputs[0]);
            const transcriptionDecoded = decodeTritonStringTensor(rawOutputs[1]);

            // Handle voices array
            let voices = [];
            for (const s of voicesDecoded) {
              try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed)) voices.push(...parsed);
                else voices.push(parsed);
              } catch {
                voices.push(s);
              }
            }

            // Handle transcription (only one element expected)
            const transcription = transcriptionDecoded[0] || "";

            resolve({ voices, transcription });
          } catch (e) {
            reject(new Error(`Failed to parse Triton output: ${e.message}`));
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

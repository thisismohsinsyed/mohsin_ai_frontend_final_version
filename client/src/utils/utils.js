export const convertoFloat32ToInt16 = (buffer) => {
  let l = buffer.length;
  let s;
  let buf = new Int16Array(l);

  while (l--) {
    s = Math.max(-1, Math.min(1, buffer[l]));
    buf[l] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return buf.buffer;
};

export const downsampleBuffer = (
  buffer,
  recordSampleRate,
  targetSampleRate
) => {
  if (targetSampleRate === recordSampleRate) return buffer;
  if (targetSampleRate > recordSampleRate)
    throw new Error(
      "Target sample rate must be lower than recorded sample rate"
    );

  const sampleRateRatio = recordSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    let nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
};

export const getLinear16 = async (samples) => {
  let buffer = new ArrayBuffer(0 + samples.length * 2);
  let view = new DataView(buffer);
  await floatTo16BitPCM(view, 0, samples);
  return Promise.resolve(view);
};

export const floatTo16BitPCM = (output, offset, input) => {
  return new Promise((resolve) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    resolve();
  });
};

/** Everything is kept as 16 kHz mono float samples — what the speech service expects. */
export const SAMPLE_RATE = 16_000;
export const MAX_RECORD_SECONDS = 30;

export function floatToInt16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export function int16ToFloat(samples: Int16Array): Float32Array {
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] / 0x8000;
  return out;
}

/** Box-filter + linear-interpolation downsampler; plenty for speech. */
function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const out = new Float32Array(Math.floor(input.length / ratio));
  const half = Math.max(0, Math.floor(ratio / 2));
  for (let i = 0; i < out.length; i++) {
    const center = i * ratio;
    const lo = Math.max(0, Math.floor(center) - half);
    const hi = Math.min(input.length - 1, Math.floor(center) + half);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += input[j];
    out[i] = sum / (hi - lo + 1);
  }
  return out;
}

const WORKLET = `
class Capture extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("capture", Capture);
`;

/** Captures microphone audio as raw samples so we can score, replay and analyze it. */
export class Recorder {
  private ctx?: AudioContext;
  private stream?: MediaStream;
  private chunks: Float32Array[] = [];
  private length = 0;

  /** Called ~every 8 ms with the current input level (0..1). */
  onLevel?: (level: number) => void;
  /** Called if the recording hits MAX_RECORD_SECONDS. */
  onLimit?: () => void;

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    this.ctx = new AudioContext();
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await this.ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    const source = this.ctx.createMediaStreamSource(this.stream);
    const node = new AudioWorkletNode(this.ctx, "capture");
    const limit = MAX_RECORD_SECONDS * this.ctx.sampleRate;
    node.port.onmessage = (e: MessageEvent<Float32Array>) => {
      if (this.length >= limit) return;
      this.chunks.push(e.data);
      this.length += e.data.length;
      let peak = 0;
      for (const v of e.data) peak = Math.max(peak, Math.abs(v));
      this.onLevel?.(peak);
      if (this.length >= limit) this.onLimit?.();
    };
    source.connect(node);
  }

  /** Stops recording and returns 16 kHz mono samples. */
  async stop(): Promise<Float32Array> {
    this.stream?.getTracks().forEach((t) => t.stop());
    const rate = this.ctx?.sampleRate ?? SAMPLE_RATE;
    await this.ctx?.close();
    const all = new Float32Array(this.length);
    let offset = 0;
    for (const c of this.chunks) {
      all.set(c, offset);
      offset += c.length;
    }
    return resample(all, rate, SAMPLE_RATE);
  }
}

let playCtx: AudioContext | null = null;
let current: AudioBufferSourceNode | null = null;

/** Plays 16 kHz samples, optionally just the [start, end) slice in seconds. */
export function play(samples: Float32Array, start = 0, end?: number): Promise<void> {
  playCtx ??= new AudioContext();
  current?.stop();
  const buffer = playCtx.createBuffer(1, samples.length, SAMPLE_RATE);
  buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
  const src = playCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(playCtx.destination);
  current = src;
  const pad = 0.05;
  const from = Math.max(0, start - pad);
  const duration = end !== undefined ? end - start + 2 * pad : undefined;
  void playCtx.resume();
  src.start(0, from, duration);
  return new Promise((resolve) => (src.onended = () => resolve()));
}

export function stopPlayback() {
  current?.stop();
  current = null;
}

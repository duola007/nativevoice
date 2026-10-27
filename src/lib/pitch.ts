import { SAMPLE_RATE } from "./audio";

export interface PitchPoint {
  t: number; // seconds
  /** Semitones relative to the speaker's median pitch; null when unvoiced. */
  st: number | null;
}

const FRAME = 1024; // 64 ms window (long enough for low voices)
const HOP = 160; // 10 ms
const MIN_HZ = 65;
const MAX_HZ = 450;
const YIN_THRESHOLD = 0.15;

/** YIN pitch estimate for one frame, or null if unvoiced. */
function yin(buf: Float32Array, start: number): number | null {
  const maxLag = Math.floor(SAMPLE_RATE / MIN_HZ);
  const minLag = Math.floor(SAMPLE_RATE / MAX_HZ);
  const w = FRAME - maxLag;
  const d = new Float32Array(maxLag + 1);
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < w; i++) {
      const diff = buf[start + i] - buf[start + i + lag];
      sum += diff * diff;
    }
    d[lag] = sum;
  }
  // Cumulative mean normalized difference.
  let running = 0;
  d[0] = 1;
  for (let lag = 1; lag <= maxLag; lag++) {
    running += d[lag];
    d[lag] = running ? (d[lag] * lag) / running : 1;
  }
  for (let lag = minLag; lag < maxLag; lag++) {
    if (d[lag] < YIN_THRESHOLD) {
      while (lag + 1 < maxLag && d[lag + 1] < d[lag]) lag++;
      // Parabolic interpolation around the minimum.
      const a = d[lag - 1], b = d[lag], c = d[lag + 1];
      const shift = (a - c) / (2 * (a - 2 * b + c)) || 0;
      return SAMPLE_RATE / (lag + shift);
    }
  }
  return null;
}

export function pitchContour(samples: Float32Array): PitchPoint[] {
  // Gate out silence relative to the loudest part of the recording.
  let peakRms = 0;
  const rms: number[] = [];
  for (let s = 0; s + FRAME < samples.length; s += HOP) {
    let e = 0;
    for (let i = 0; i < FRAME; i++) e += samples[s + i] ** 2;
    const r = Math.sqrt(e / FRAME);
    rms.push(r);
    peakRms = Math.max(peakRms, r);
  }

  const hz: (number | null)[] = rms.map((r, i) =>
    r > peakRms * 0.08 ? yin(samples, i * HOP) : null,
  );

  // Median-smooth to remove octave jumps and single-frame blips.
  const smooth = hz.map((v, i) => {
    if (v === null) return null;
    const win = hz.slice(Math.max(0, i - 2), i + 3).filter((x): x is number => x !== null);
    if (win.length < 3) return null;
    return win.sort((a, b) => a - b)[Math.floor(win.length / 2)];
  });

  const voiced = smooth.filter((x): x is number => x !== null).sort((a, b) => a - b);
  const median = voiced[Math.floor(voiced.length / 2)] ?? 150;
  return smooth.map((v, i) => ({
    t: (i * HOP + FRAME / 2) / SAMPLE_RATE,
    st: v === null ? null : 12 * Math.log2(v / median),
  }));
}

/**
 * Builds a function mapping times in the learner's recording onto the native
 * recording's timeline, piecewise-linear between matching word boundaries, so
 * both pitch curves line up word by word even when speaking speeds differ.
 */
export function timeWarp(
  pairs: { user: [number, number]; native: [number, number] }[],
): (t: number) => number {
  const anchors: [number, number][] = [];
  for (const p of pairs) {
    for (const k of [0, 1] as const) {
      const last = anchors[anchors.length - 1];
      if (!last || (p.user[k] > last[0] && p.native[k] > last[1])) {
        anchors.push([p.user[k], p.native[k]]);
      }
    }
  }
  if (anchors.length < 2) return (t) => t;
  return (t) => {
    let i = 1;
    while (i < anchors.length - 1 && t > anchors[i][0]) i++;
    const [u0, n0] = anchors[i - 1];
    const [u1, n1] = anchors[i];
    return n0 + ((t - u0) * (n1 - n0)) / (u1 - u0);
  };
}

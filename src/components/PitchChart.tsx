import { useMemo } from "react";
import type { NativeAudio, WordResult } from "../lib/azure";
import { pitchContour, timeWarp, type PitchPoint } from "../lib/pitch";

interface Props {
  userAudio: Float32Array;
  native: NativeAudio;
  words: WordResult[];
  wordMap: Map<number, number>;
}

const W = 800;
const H = 220;
const PAD_X = 12;
const TOP = 12;
const PLOT_H = 160;
const RANGE = 9; // ± semitones shown

export function PitchChart({ userAudio, native, words, wordMap }: Props) {
  const chart = useMemo(() => {
    const nativePitch = pitchContour(native.samples);
    const userPitch = pitchContour(userAudio);

    const pairs = [...wordMap].flatMap(([ui, ni]) => {
      const u = words[ui];
      if (u.start === undefined || u.end === undefined) return [];
      return [{ user: [u.start, u.end] as [number, number], native: [native.words[ni].start, native.words[ni].end] as [number, number] }];
    });

    let warp: (t: number) => number;
    let t0: number, t1: number;
    if (pairs.length >= 2 && native.words.length) {
      warp = timeWarp(pairs);
      t0 = native.words[0].start - 0.15;
      t1 = native.words[native.words.length - 1].end + 0.15;
    } else {
      // No word alignment: stretch each voiced region over the same span.
      const span = (p: PitchPoint[]) => {
        const v = p.filter((x) => x.st !== null);
        return v.length ? [v[0].t, v[v.length - 1].t] : [0, 1];
      };
      const [ns, ne] = span(nativePitch);
      const [us, ue] = span(userPitch);
      warp = (t) => ns + ((t - us) * (ne - ns)) / (ue - us || 1);
      t0 = ns - 0.1;
      t1 = ne + 0.1;
    }

    const x = (t: number) => PAD_X + ((t - t0) / (t1 - t0)) * (W - 2 * PAD_X);
    const y = (st: number) => TOP + PLOT_H / 2 - (Math.max(-RANGE, Math.min(RANGE, st)) / RANGE) * (PLOT_H / 2);

    const path = (pts: PitchPoint[], map: (t: number) => number) => {
      let d = "";
      let pen = false;
      for (const p of pts) {
        const t = map(p.t);
        if (p.st === null || t < t0 || t > t1) {
          pen = false;
          continue;
        }
        d += `${pen ? "L" : "M"}${x(t).toFixed(1)},${y(p.st).toFixed(1)}`;
        pen = true;
      }
      return d;
    };

    return {
      nativePath: path(nativePitch, (t) => t),
      userPath: path(userPitch, warp),
      labels: native.words.map((w) => ({ text: w.text, x0: x(w.start), x1: x(w.end) })),
    };
  }, [userAudio, native, words, wordMap]);

  return (
    <div className="pitch">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pitch contour comparison">
        <line x1={PAD_X} x2={W - PAD_X} y1={TOP + PLOT_H / 2} y2={TOP + PLOT_H / 2} className="axis" />
        {chart.labels.map((l, i) => (
          <g key={i}>
            <rect x={l.x0} y={TOP} width={Math.max(1, l.x1 - l.x0)} height={PLOT_H} className={i % 2 ? "band" : "band alt"} />
            <text x={(l.x0 + l.x1) / 2} y={TOP + PLOT_H + 22} textAnchor="middle" className="wlabel">
              {l.text}
            </text>
          </g>
        ))}
        <path d={chart.nativePath} className="native-line" />
        <path d={chart.userPath} className="user-line" />
      </svg>
      <div className="legend">
        <span><i className="sw native" />Native</span>
        <span><i className="sw you" />You</span>
      </div>
    </div>
  );
}

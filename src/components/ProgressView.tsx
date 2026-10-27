import { CONTRASTS } from "../data/minimalPairs";
import { CONFUSION_TIPS, PHONEMES, phonemeLabel } from "../data/phonemes";
import { resetProgress, topConfusions, weakSounds, type Progress } from "../lib/progress";
import { scoreClass } from "./Results";

interface Props {
  progress: Progress;
  setProgress: (fn: (p: Progress) => Progress) => void;
  onPracticeSound: (ipa: string) => void;
}

export function ProgressView({ progress, setProgress, onPracticeSound }: Props) {
  const { attempts } = progress;
  const weak = weakSounds(progress);
  const confusions = topConfusions(progress);
  const ear = CONTRASTS.filter((c) => progress.ear[c.id]);

  if (attempts.length === 0) {
    return (
      <section className="card center">
        <h3>No practice yet</h3>
        <p className="hint">Record a few sentences and your weakest sounds will show up here.</p>
      </section>
    );
  }

  const recent = attempts.slice(-10);
  const first = attempts.slice(0, 10);
  const mean = (xs: { overall: number }[]) => Math.round(xs.reduce((a, b) => a + b.overall, 0) / xs.length);
  const today = attempts.filter((a) => a.at > Date.now() - 86_400_000).length;

  return (
    <div className="stack">
      <section className="card">
        <div className="stats">
          <div><b>{attempts.length}</b><span>recordings</span></div>
          <div><b>{today}</b><span>today</span></div>
          <div><b>{mean(recent)}</b><span>recent avg</span></div>
          {attempts.length > 10 && (
            <div>
              <b className={mean(recent) >= mean(first) ? "up" : "down"}>
                {mean(recent) >= mean(first) ? "+" : ""}{mean(recent) - mean(first)}
              </b>
              <span>since you started</span>
            </div>
          )}
        </div>
        <Sparkline values={attempts.slice(-60).map((a) => a.overall)} />
      </section>

      <section className="card">
        <h3>Your weakest sounds</h3>
        {weak.length === 0 ? (
          <p className="hint">Keep practicing — sounds appear here after a few attempts.</p>
        ) : (
          <ul className="weak">
            {weak.slice(0, 8).map((w) => (
              <li key={w.ipa}>
                <div className="row">
                  <span className="ipa-lg">{w.ipa}</span>
                  <div className="grow">
                    <div className="row">
                      <span>{phonemeLabel(w.ipa)}</span>
                      <span className="spacer" />
                      <span className={`num ${scoreClass(w.score)}`}>{w.score}</span>
                    </div>
                    <div className="bar"><div className={`bar-fill ${scoreClass(w.score)}`} style={{ width: `${w.score}%` }} /></div>
                  </div>
                  <button className="btn sm" onClick={() => onPracticeSound(w.ipa)}>Practice</button>
                </div>
                {w.score < 80 && PHONEMES[w.ipa] && <p className="hint">{PHONEMES[w.ipa].tip}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {confusions.length > 0 && (
        <section className="card">
          <h3>Your sound swaps</h3>
          <p className="hint">Sounds that came out as a different sound, most frequent first.</p>
          <ul className="tips">
            {confusions.map((c) => (
              <li key={c.target + c.heard}>
                <strong>/{c.target}/ → /{c.heard}/</strong> ×{c.count}
                {PHONEMES[c.target] && PHONEMES[c.heard] && (
                  <> — “{PHONEMES[c.target].example}” sounded like the sound in “{PHONEMES[c.heard].example}”</>
                )}
                {CONFUSION_TIPS[`${c.target}>${c.heard}`] && <div>{CONFUSION_TIPS[`${c.target}>${c.heard}`]}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ear.length > 0 && (
        <section className="card">
          <h3>Ear training</h3>
          <ul className="weak">
            {ear.map((c) => {
              const s = progress.ear[c.id];
              const pct = Math.round((100 * s.right) / s.total);
              return (
                <li key={c.id}>
                  <div className="row">
                    <span className="grow">{c.label}</span>
                    <span className={`num ${scoreClass(pct)}`}>{pct}%</span>
                    <span className="hint">({s.total})</span>
                  </div>
                  <div className="bar"><div className={`bar-fill ${scoreClass(pct)}`} style={{ width: `${pct}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="center">
        <button
          className="btn ghost"
          onClick={() => {
            if (confirm("Delete all practice history on this device?")) {
              resetProgress();
              setProgress(() => ({ attempts: [], phonemes: {}, confusions: {}, ear: {} }));
            }
          }}
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const W = 600, H = 80;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - (v / 100) * H;
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spark" preserveAspectRatio="none" aria-label="Score history">
      <line x1="0" x2={W} y1={y(80)} y2={y(80)} className="axis" />
      <path d={d} className="user-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

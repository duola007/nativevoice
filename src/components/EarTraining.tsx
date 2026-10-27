import { useEffect, useMemo, useState } from "react";
import { CONTRASTS, type Contrast } from "../data/minimalPairs";
import { profileFor } from "../data/languages";
import { synthesize } from "../lib/azure";
import { play } from "../lib/audio";
import { recordEar, type Progress, type Settings } from "../lib/progress";
import { VOICES } from "../data/voices";
import { errorText } from "./Practice";

interface Props {
  settings: Settings;
  progress: Progress;
  setProgress: (fn: (p: Progress) => Progress) => void;
}

interface Round {
  pair: [string, string];
  answer: 0 | 1;
  voice: string;
}

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

export function EarTraining({ settings, progress, setProgress }: Props) {
  const profile = profileFor(settings.nativeLanguage);
  const recommended = useMemo(
    () => CONTRASTS.filter((c) => profile?.focus.some((f) => c.sounds.includes(f))).map((c) => c.id),
    [profile],
  );
  const [contrast, setContrast] = useState<Contrast>(
    () => CONTRASTS.find((c) => recommended.includes(c.id)) ?? CONTRASTS[0],
  );
  const [round, setRound] = useState<Round | null>(null);
  const [guess, setGuess] = useState<0 | 1 | null>(null);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const newRound = (c = contrast) => {
    // Different voices each round, so you learn the sound, not one speaker.
    const r: Round = { pair: pick(c.pairs), answer: Math.random() < 0.5 ? 0 : 1, voice: pick(VOICES).id };
    setRound(r);
    setGuess(null);
    void say(r.pair[r.answer], r.voice);
  };

  async function say(word: string, voice: string) {
    setError(null);
    try {
      const audio = await synthesize(word, voice);
      await play(audio.samples);
    } catch (e) {
      setError(errorText(e));
    }
  }

  useEffect(() => setRound(null), [contrast]);

  function answer(i: 0 | 1) {
    if (!round || guess !== null) return;
    setGuess(i);
    const correct = i === round.answer;
    setStreak((s) => (correct ? s + 1 : 0));
    setProgress((p) => recordEar(p, contrast.id, correct));
  }

  const stats = progress.ear[contrast.id];

  return (
    <div className="stack">
      <section className="card">
        <h3>Ear training</h3>
        <p className="hint">
          You'll hear one word. Pick which one it was. Being able to <em>hear</em> a difference is the first step to making it.
        </p>
        <div className="chips">
          {CONTRASTS.map((c) => (
            <button key={c.id} className={`chip ${c.id === contrast.id ? "on" : ""}`} onClick={() => setContrast(c)}>
              {c.label}
              {recommended.includes(c.id) && <span className="star" title={`Common for ${profile?.name} speakers`}>★</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="card ear">
        {!round ? (
          <button className="btn primary big" onClick={() => newRound()}>Start: {contrast.label}</button>
        ) : (
          <>
            <button className="btn" onClick={() => say(round.pair[round.answer], round.voice)}>🔊 Play again</button>
            <div className="pair">
              {round.pair.map((w, i) => (
                <button
                  key={w}
                  className={`pair-btn ${guess !== null && i === round.answer ? "right" : ""} ${guess === i && i !== round.answer ? "wrong" : ""}`}
                  onClick={() => answer(i as 0 | 1)}
                >
                  {w}
                  <small>/{contrast.sounds[i]}/</small>
                </button>
              ))}
            </div>
            {guess !== null && (
              <div className="stack-sm center">
                <p className="headline">{guess === round.answer ? `Correct! 🔥 ${streak} in a row` : `It was “${round.pair[round.answer]}”.`}</p>
                <div className="row center-row">
                  <button className="btn sm" onClick={() => say(round.pair[0], round.voice)}>▶ {round.pair[0]}</button>
                  <button className="btn sm" onClick={() => say(round.pair[1], round.voice)}>▶ {round.pair[1]}</button>
                  <button className="btn sm primary" onClick={() => newRound()}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
        {stats && <p className="hint center">All-time: {stats.right}/{stats.total} correct ({Math.round((100 * stats.right) / stats.total)}%)</p>}
        {error && <div className="alert">{error}</div>}
      </section>
    </div>
  );
}

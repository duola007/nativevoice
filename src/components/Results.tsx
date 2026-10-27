import { useMemo, useState } from "react";
import type { WordResult } from "../lib/azure";
import { play } from "../lib/audio";
import { matchWords } from "../lib/align";
import type { Progress, Settings } from "../lib/progress";
import { CONFUSION_TIPS, PHONEMES, phonemeLabel } from "../data/phonemes";
import type { Attempt } from "./Practice";
import { PitchChart } from "./PitchChart";
import { Coach } from "./Coach";

export const scoreClass = (s: number) => (s >= 80 ? "good" : s >= 60 ? "ok" : "bad");

interface Props {
  attempt: Attempt;
  settings: Settings;
  progress: Progress;
  coachEnabled: boolean;
  onPractice: (text: string) => void;
}

export function Results({ attempt, settings, progress, coachEnabled, onPractice }: Props) {
  const { assessment, userAudio, native } = attempt;
  const { scores, words } = assessment;
  const wordMap = useMemo(() => (native ? matchWords(words, native.words) : new Map<number, number>()), [words, native]);

  // Open on the weakest word so the most useful feedback is visible immediately.
  const [selected, setSelected] = useState<number | null>(() => {
    let worst: number | null = null;
    words.forEach((w, i) => {
      if (w.errorType === "Insertion") return;
      if (worst === null || w.accuracy < words[worst].accuracy) worst = i;
    });
    return worst !== null && words[worst].accuracy < 80 ? worst : null;
  });

  const scoreItems: [string, number | undefined, string][] = [
    ["Overall", scores.overall, "Combined pronunciation score"],
    ["Accuracy", scores.accuracy, "How closely each sound matches a native speaker"],
    ["Fluency", scores.fluency, "Smoothness: pauses and speed"],
    ["Completeness", scores.completeness, "How much of the text you said"],
    ["Prosody", scores.prosody, "Stress, intonation, rhythm"],
  ];

  return (
    <div className="stack">
      <section className="card">
        <div className="scores">
          {scoreItems.filter(([, v]) => v !== undefined).map(([label, value, title]) => (
            <div key={label} className={`score ${scoreClass(value!)} ${label === "Overall" ? "big" : ""}`} title={title}>
              <Ring value={value!} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <p className="hint center">Tap any word to see each sound.</p>
        <div className="words">
          {words.map((w, i) => (
            <button
              key={i}
              className={`word ${wordClass(w)} ${selected === i ? "selected" : ""}`}
              onClick={() => setSelected(selected === i ? null : i)}
              title={w.errorType !== "None" ? w.errorType : `${w.accuracy}`}
            >
              {w.prosodyIssues.includes("Unexpected pause") && <span className="pause-mark" title="Unexpected pause">‖</span>}
              {w.text}
            </button>
          ))}
        </div>
        <div className="legend">
          <span><i className="sw good" />Great</span>
          <span><i className="sw ok" />Close</span>
          <span><i className="sw bad" />Needs work</span>
          <span><i className="sw omit" />Skipped</span>
          <span><i className="sw insert" />Extra word</span>
        </div>

        {selected !== null && (
          <WordDetail
            word={words[selected]}
            onPlayMine={() => {
              const w = words[selected];
              if (w.start !== undefined) void play(userAudio, w.start, w.end);
            }}
            onPlayNative={
              native && wordMap.has(selected)
                ? () => {
                    const nw = native.words[wordMap.get(selected)!];
                    void play(native.samples, nw.start, nw.end);
                  }
                : undefined
            }
          />
        )}

        <div className="row wrap center-row">
          <button className="btn" onClick={() => play(userAudio)}>▶ Your recording</button>
          {native && <button className="btn" onClick={() => play(native.samples)}>▶ Native speaker</button>}
        </div>
      </section>

      {native && (
        <section className="card">
          <h3>Intonation</h3>
          <p className="hint">
            Your pitch (color) over a native speaker's (gray), lined up word by word. Rises and falls should follow the same shape — stressed words usually peak.
          </p>
          <PitchChart userAudio={userAudio} native={native} words={words} wordMap={wordMap} />
        </section>
      )}

      <Coach
        attempt={attempt}
        settings={settings}
        progress={progress}
        enabled={coachEnabled}
        onPractice={onPractice}
      />
    </div>
  );
}

function wordClass(w: WordResult) {
  if (w.errorType === "Omission") return "omit";
  if (w.errorType === "Insertion") return "insert";
  return scoreClass(w.accuracy);
}

function WordDetail({ word, onPlayMine, onPlayNative }: { word: WordResult; onPlayMine: () => void; onPlayNative?: () => void }) {
  const problems = word.phonemes.filter((p) => p.score < 70).sort((a, b) => a.score - b.score);
  return (
    <div className="word-detail">
      <div className="row wrap">
        <h3 className="word-title">{word.text}</h3>
        {word.errorType === "Omission" && <span className="badge bad">Skipped</span>}
        {word.errorType === "Insertion" && <span className="badge">Not in the text</span>}
        {word.prosodyIssues.map((p) => <span key={p} className="badge ok">{p}</span>)}
        <span className="spacer" />
        {onPlayNative && <button className="btn sm" onClick={onPlayNative}>▶ Native</button>}
        {word.start !== undefined && <button className="btn sm" onClick={onPlayMine}>▶ You</button>}
      </div>

      {word.phonemes.length > 0 && word.errorType !== "Omission" && (
        <div className="phonemes">
          {word.phonemes.map((p, i) => (
            <div key={i} className={`phoneme ${scoreClass(p.score)}`} title={phonemeLabel(p.ipa)}>
              <span className="ipa">{p.ipa}</span>
              <span className="pscore">{p.score}</span>
              {p.heardAs && <span className="heard">≈ {p.heardAs}</span>}
            </div>
          ))}
        </div>
      )}

      {problems.length > 0 && word.errorType !== "Omission" && (
        <ul className="tips">
          {problems.slice(0, 3).map((p, i) => {
            const info = PHONEMES[p.ipa];
            const confusion = p.heardAs ? CONFUSION_TIPS[`${p.ipa}>${p.heardAs}`] : undefined;
            return (
              <li key={i}>
                <strong>{phonemeLabel(p.ipa)}</strong>
                {p.heardAs && <> — sounded like <strong>/{p.heardAs}/</strong>{PHONEMES[p.heardAs] && <> (as in “{PHONEMES[p.heardAs].example}”)</>}</>}
                <div>{confusion ?? info?.tip}</div>
              </li>
            );
          })}
        </ul>
      )}
      {problems.length === 0 && word.errorType === "None" && <p className="hint">Every sound in this word is solid. 👍</p>}
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="ring" aria-label={`${value} out of 100`}>
      <circle cx="32" cy="32" r={r} className="ring-bg" />
      <circle
        cx="32" cy="32" r={r}
        className="ring-fg"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle">{value}</text>
    </svg>
  );
}

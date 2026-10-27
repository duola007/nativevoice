import { useState } from "react";
import type { Attempt } from "./Practice";
import { errorText } from "./Practice";
import { weakSounds, type Progress, type Settings } from "../lib/progress";

interface CoachResponse {
  headline: string;
  tips: { focus: string; explanation: string; howTo: string; practiceWords: string[] }[];
  nextSentence: string;
  encouragement: string;
}

interface Props {
  attempt: Attempt;
  settings: Settings;
  progress: Progress;
  enabled: boolean;
  onPractice: (text: string) => void;
}

export function Coach({ attempt, settings, progress, enabled, onPractice }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<CoachResponse | null>(null);
  const [error, setError] = useState("");

  if (!enabled) {
    return (
      <section className="card muted">
        <h3>AI coach</h3>
        <p className="hint">
          Add <code>ANTHROPIC_API_KEY</code> to <code>.env</code> to get personalized coaching that explains
          <em> why</em> each error happens for speakers of your language, and what to practice next.
        </p>
      </section>
    );
  }

  async function ask() {
    setState("loading");
    const { assessment } = attempt;
    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceText: attempt.text,
          nativeLanguage: settings.nativeLanguage || "unknown",
          scores: assessment.scores,
          words: assessment.words.map((w) => ({
            word: w.text,
            accuracy: w.accuracy,
            errorType: w.errorType,
            prosodyIssues: w.prosodyIssues,
            phonemes: w.phonemes,
          })),
          weakSounds: weakSounds(progress).slice(0, 5).map((w) => `${w.ipa} ${w.score}`),
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "Coach request failed");
      setData(body);
      setState("done");
    } catch (e) {
      setError(errorText(e));
      setState("error");
    }
  }

  return (
    <section className="card coach">
      <div className="row">
        <h3>AI coach</h3>
        <span className="spacer" />
        {state !== "done" && (
          <button className="btn primary" onClick={ask} disabled={state === "loading"}>
            {state === "loading" ? "Thinking…" : "✨ Get coaching"}
          </button>
        )}
      </div>
      {state === "error" && <div className="alert">{error}</div>}
      {data && (
        <div className="stack-sm">
          <p className="headline">{data.headline}</p>
          {data.tips.map((t, i) => (
            <div key={i} className="tip-card">
              <strong>{t.focus}</strong>
              <p>{t.explanation}</p>
              <p><span className="label">How:</span> {t.howTo}</p>
              {t.practiceWords.length > 0 && (
                <div className="chips">
                  {t.practiceWords.map((w) => <span key={w} className="chip static">{w}</span>)}
                </div>
              )}
            </div>
          ))}
          <div className="next">
            <span className="label">Try next:</span> “{data.nextSentence}”
            <button className="btn sm primary" onClick={() => onPractice(data.nextSentence)}>Practice it</button>
          </div>
          <p className="hint">{data.encouragement}</p>
        </div>
      )}
    </section>
  );
}

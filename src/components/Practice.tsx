import { useEffect, useMemo, useRef, useState } from "react";
import { assess, synthesize, type Assessment, type NativeAudio } from "../lib/azure";
import { MAX_RECORD_SECONDS, Recorder, SAMPLE_RATE, play, stopPlayback } from "../lib/audio";
import { recordAttempt, weakSounds, type Progress, type Settings } from "../lib/progress";
import { SENTENCES } from "../data/sentences";
import { profileFor } from "../data/languages";
import { Results } from "./Results";
import { demoAttempt, isDemo } from "../dev/demo";

const GROUPS: { label: string; sounds: string[] }[] = [
  { label: "TH", sounds: ["θ", "ð"] },
  { label: "R & L", sounds: ["ɹ", "l"] },
  { label: "V & W", sounds: ["v", "w", "f"] },
  { label: "Long & short vowels", sounds: ["i", "ɪ", "ʊ", "u"] },
  { label: "A, E, U", sounds: ["æ", "ɛ", "ʌ"] },
  { label: "S, Z, SH, CH", sounds: ["s", "z", "ʃ", "ʒ", "tʃ", "dʒ"] },
];

export interface Attempt {
  text: string;
  assessment: Assessment;
  userAudio: Float32Array;
  native: NativeAudio | null;
}

interface Props {
  settings: Settings;
  progress: Progress;
  setProgress: (fn: (p: Progress) => Progress) => void;
  coachEnabled: boolean;
  /** Sounds requested from elsewhere (e.g. the Progress tab). */
  focus: string[] | null;
  setFocus: (f: string[] | null) => void;
}

type Phase = "idle" | "recording" | "analyzing";

export function Practice({ settings, progress, setProgress, coachEnabled, focus, setFocus }: Props) {
  const weak = useMemo(() => weakSounds(progress), [progress]);
  const profile = profileFor(settings.nativeLanguage);

  // Recommended = the learner's own weakest sounds once we know them, else their L1's usual suspects.
  const targets = focus ?? (weak.length >= 3 ? weak.slice(0, 4).map((w) => w.ipa) : profile?.focus ?? []);
  const list = useMemo(() => {
    const scored = SENTENCES.map((s) => ({ s, hits: s.focus.filter((f) => targets.includes(f)).length }));
    const matching = scored.filter((x) => x.hits > 0 || targets.length === 0);
    return (matching.length ? matching : scored)
      .sort((a, b) => b.hits - a.hits || a.s.level - b.s.level)
      .map((x) => x.s.text);
  }, [targets.join(",")]);

  const [index, setIndex] = useState(0);
  const [customText, setCustomText] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const text = customText ?? list[index % list.length];

  const [phase, setPhase] = useState<Phase>("idle");
  const [listening, setListening] = useState<null | "normal" | "slow">(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(() => (isDemo ? demoAttempt() : null));
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<Recorder | null>(null);
  const meter = useRef<HTMLDivElement>(null);

  useEffect(() => setIndex(0), [list]);
  // Warm the native recording so "Listen" and the pitch chart are instant.
  useEffect(() => {
    if (!isDemo) synthesize(text, settings.voice).catch(() => {});
  }, [text, settings.voice]);

  useEffect(() => {
    if (phase !== "recording") return;
    const started = Date.now();
    const id = setInterval(() => setSeconds((Date.now() - started) / 1000), 200);
    return () => clearInterval(id);
  }, [phase]);

  const changeText = (next: () => void) => {
    next();
    setAttempt(null);
    setError(null);
  };

  async function listen(slow: boolean) {
    setError(null);
    setListening(slow ? "slow" : "normal");
    try {
      const native = await synthesize(text, settings.voice, slow ? 0.7 : 1);
      await play(native.samples);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setListening(null);
    }
  }

  async function startRecording() {
    setError(null);
    stopPlayback();
    const rec = new Recorder();
    let level = 0;
    rec.onLevel = (peak) => {
      level = Math.max(peak, level * 0.85);
      if (meter.current) meter.current.style.transform = `scaleX(${Math.min(1, level * 1.6)})`;
    };
    rec.onLimit = () => void stopRecording();
    recorder.current = rec;
    try {
      await rec.start();
      setSeconds(0);
      setPhase("recording");
    } catch {
      recorder.current = null;
      setError("Couldn't access the microphone. Allow microphone access in your browser and try again.");
    }
  }

  async function stopRecording() {
    const rec = recorder.current;
    if (!rec) return;
    recorder.current = null;
    setPhase("analyzing");
    try {
      const samples = await rec.stop();
      if (samples.length < SAMPLE_RATE * 0.4) throw new Error("That was too short — hold the button until you finish the sentence.");
      const [assessment, native] = await Promise.all([
        assess(samples, text),
        synthesize(text, settings.voice).catch(() => null),
      ]);
      setAttempt({ text, assessment, userAudio: samples, native });
      setProgress((p) => recordAttempt(p, text, assessment));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPhase("idle");
    }
  }

  const busy = phase !== "idle";

  return (
    <div className="stack">
      <div className="chips" role="group" aria-label="Focus sounds">
        <button className={`chip ${!focus ? "on" : ""}`} onClick={() => changeText(() => { setFocus(null); setCustomText(null); })}>
          Recommended for you
        </button>
        {GROUPS.map((g) => (
          <button
            key={g.label}
            className={`chip ${focus?.join() === g.sounds.join() ? "on" : ""}`}
            onClick={() => changeText(() => { setFocus(g.sounds); setCustomText(null); })}
          >
            {g.label}
          </button>
        ))}
        {focus && !GROUPS.some((g) => g.sounds.join() === focus.join()) && (
          <button className="chip on">/{focus.join("/")}/</button>
        )}
      </div>

      <section className="card sentence-card">
        {!focus && !customText && (
          <p className="eyebrow">
            {weak.length >= 3
              ? `Targeting your weakest sounds: ${weak.slice(0, 4).map((w) => `/${w.ipa}/`).join(" ")}`
              : profile
                ? `Common challenges for ${profile.name} speakers`
                : "Pick your native language at the top for tailored practice"}
          </p>
        )}
        {editing ? (
          <div className="stack-sm">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste a line from your presentation, an email, or anything you need to say…"
              rows={3}
              autoFocus
            />
            <p className="hint">Tip: one or two sentences at a time works best (up to {MAX_RECORD_SECONDS} seconds).</p>
            <div className="row">
              <button
                className="btn primary"
                disabled={!draft.trim()}
                onClick={() => changeText(() => { setCustomText(draft.trim()); setEditing(false); })}
              >
                Practice this
              </button>
              <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <p className="sentence">{text}</p>
        )}

        {!editing && (
          <div className="row wrap">
            <button className="btn" disabled={busy || !!listening} onClick={() => listen(false)}>
              {listening === "normal" ? "Playing…" : "▶ Listen"}
            </button>
            <button className="btn" disabled={busy || !!listening} onClick={() => listen(true)}>
              {listening === "slow" ? "Playing…" : "🐢 Slow"}
            </button>
            <span className="spacer" />
            {customText && (
              <button className="btn ghost" disabled={busy} onClick={() => changeText(() => setCustomText(null))}>
                Back to library
              </button>
            )}
            <button className="btn ghost" disabled={busy} onClick={() => { setDraft(customText ?? ""); setEditing(true); }}>
              ✎ Your own text
            </button>
            {!customText && (
              <button className="btn ghost" disabled={busy} onClick={() => changeText(() => setIndex((i) => i + 1))}>
                Next →
              </button>
            )}
          </div>
        )}
      </section>

      {!editing && (
        <section className="record-area">
          {phase === "recording" ? (
            <>
              <button className="record-btn recording" onClick={stopRecording} aria-label="Stop recording">
                <span className="square" />
              </button>
              <div className="meter"><div ref={meter} className="meter-fill" /></div>
              <p className="hint">Recording… {seconds.toFixed(0)}s — tap to stop</p>
            </>
          ) : (
            <>
              <button className="record-btn" onClick={startRecording} disabled={busy} aria-label="Start recording">
                {phase === "analyzing" ? <span className="spinner" /> : <span className="dot" />}
              </button>
              <p className="hint">{phase === "analyzing" ? "Analyzing every sound…" : "Tap and read the sentence aloud"}</p>
            </>
          )}
        </section>
      )}

      {error && <div className="alert">{error}</div>}

      {attempt && (
        <Results
          key={attempt.userAudio.length + attempt.text}
          attempt={attempt}
          settings={settings}
          progress={progress}
          coachEnabled={coachEnabled}
          onPractice={(t) => changeText(() => setCustomText(t))}
        />
      )}
    </div>
  );
}

export function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

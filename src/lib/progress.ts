import type { Assessment } from "./azure";

/** Local, per-browser learning history. */
export interface Progress {
  attempts: { at: number; text: string; overall: number; prosody?: number }[];
  /** Per-phoneme running stats; `recent` holds the last 20 scores. */
  phonemes: Record<string, { n: number; sum: number; recent: number[] }>;
  /** "θ>s" → how often the target θ came out as s. */
  confusions: Record<string, number>;
  /** Ear-training results per contrast id. */
  ear: Record<string, { right: number; total: number }>;
}

export interface Settings {
  nativeLanguage: string;
  voice: string;
}

const PROGRESS_KEY = "speakwell.progress.v1";
const SETTINGS_KEY = "speakwell.settings.v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — progress just won't persist */
  }
}

const emptyProgress = (): Progress => ({ attempts: [], phonemes: {}, confusions: {}, ear: {} });

export const loadProgress = () => load(PROGRESS_KEY, emptyProgress());
export const saveProgress = (p: Progress) => save(PROGRESS_KEY, p);
export const resetProgress = () => save(PROGRESS_KEY, emptyProgress());

export const loadSettings = () =>
  load<Settings>(SETTINGS_KEY, { nativeLanguage: "", voice: "en-US-AvaNeural" });
export const saveSettings = (s: Settings) => save(SETTINGS_KEY, s);

export function recordAttempt(p: Progress, text: string, a: Assessment): Progress {
  const next: Progress = structuredClone(p);
  next.attempts.push({ at: Date.now(), text, overall: a.scores.overall, prosody: a.scores.prosody });
  next.attempts = next.attempts.slice(-500);
  for (const w of a.words) {
    if (w.errorType === "Omission" || w.errorType === "Insertion") continue;
    for (const ph of w.phonemes) {
      const s = (next.phonemes[ph.ipa] ??= { n: 0, sum: 0, recent: [] });
      s.n++;
      s.sum += ph.score;
      s.recent = [...s.recent, ph.score].slice(-20);
      if (ph.heardAs) {
        const key = `${ph.ipa}>${ph.heardAs}`;
        next.confusions[key] = (next.confusions[key] ?? 0) + 1;
      }
    }
  }
  return next;
}

export function recordEar(p: Progress, contrastId: string, correct: boolean): Progress {
  const next: Progress = structuredClone(p);
  const s = (next.ear[contrastId] ??= { right: 0, total: 0 });
  s.total++;
  if (correct) s.right++;
  return next;
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Sounds ranked weakest-first by recent average; needs a few samples to count. */
export function weakSounds(p: Progress, minSamples = 4) {
  return Object.entries(p.phonemes)
    .filter(([, s]) => s.recent.length >= minSamples)
    .map(([ipa, s]) => ({ ipa, score: Math.round(avg(s.recent)), samples: s.n }))
    .sort((a, b) => a.score - b.score);
}

export function topConfusions(p: Progress, limit = 6) {
  return Object.entries(p.confusions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => {
      const [target, heard] = key.split(">");
      return { target, heard, count };
    });
}

// Development-only sample attempt: open http://localhost:5173/?demo to preview the
// results screen without Azure credentials.
import { parseAssessment, type NativeAudio } from "../lib/azure";
import { SAMPLE_RATE } from "../lib/audio";
import type { Attempt } from "../components/Practice";

export const isDemo = import.meta.env.DEV && new URLSearchParams(location.search).has("demo");

const TEXT = "I think three of them are thirsty.";
const WORDS = TEXT.replace(/[.]/g, "").split(" ");

/** A crude voiced signal whose pitch follows `contour(t)` in Hz. */
function tone(seconds: number, contour: (t: number) => number | null): Float32Array {
  const out = new Float32Array(Math.round(seconds * SAMPLE_RATE));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const hz = contour(i / SAMPLE_RATE);
    if (hz === null) continue;
    phase += (2 * Math.PI * hz) / SAMPLE_RATE;
    out[i] = 0.4 * Math.sin(phase) + 0.15 * Math.sin(2 * phase);
  }
  return out;
}

function timings(start: number, step: number) {
  return WORDS.map((w, i) => ({ text: w, start: start + i * step, end: start + i * step + step * 0.85 }));
}

export function demoAttempt(): Attempt {
  const nWords = timings(0.2, 0.32);
  const uWords = timings(0.4, 0.45);
  const voiced = (ws: typeof nWords, t: number) => ws.some((w) => t >= w.start && t <= w.end);
  // Native: rises to a peak on "thirsty", then falls. Learner: flatter.
  const native: NativeAudio = {
    words: nWords,
    samples: tone(2.6, (t) => (voiced(nWords, t) ? 190 + 40 * Math.sin(t * 2.2) + (t > 1.7 ? 60 * Math.sin((t - 1.7) * 4) : 0) : null)),
  };
  const userAudio = tone(3.8, (t) => (voiced(uWords, t) ? 120 + 6 * Math.sin(t * 3) : null));

  const scores: Record<string, [number, string, [string, number, string?][]]> = {
    i: [98, "None", [["aɪ", 98]]],
    think: [42, "Mispronunciation", [["θ", 14, "s"], ["ɪ", 62, "i"], ["ŋ", 90], ["k", 95]]],
    three: [55, "Mispronunciation", [["θ", 22, "t"], ["ɹ", 58, "l"], ["i", 92]]],
    of: [90, "None", [["ʌ", 88], ["v", 92]]],
    them: [74, "None", [["ð", 60, "d"], ["ɛ", 85], ["m", 90]]],
    are: [93, "None", [["ɑ", 92], ["ɹ", 94]]],
    thirsty: [81, "None", [["θ", 70], ["ɝ", 84], ["s", 95], ["t", 90], ["i", 88]]],
  };
  const json = {
    DisplayText: "I sink tree of dem are thirsty.",
    NBest: [{
      PronunciationAssessment: { PronScore: 74, AccuracyScore: 71, FluencyScore: 83, CompletenessScore: 100, ProsodyScore: 68 },
      Words: WORDS.map((w, i) => {
        const [acc, err, ph] = scores[w.toLowerCase()];
        return {
          Word: w.toLowerCase(),
          Offset: uWords[i].start * 1e7,
          Duration: (uWords[i].end - uWords[i].start) * 1e7,
          PronunciationAssessment: {
            AccuracyScore: acc,
            ErrorType: err,
            Feedback: { Prosody: { Break: { ErrorTypes: w === "three" ? ["UnexpectedBreak"] : ["None"] }, Intonation: { ErrorTypes: [] } } },
          },
          Phonemes: ph.map(([ipa, s, heard]) => ({
            Phoneme: ipa,
            PronunciationAssessment: { AccuracyScore: s, NBestPhonemes: heard ? [{ Phoneme: heard, Score: 80 }] : [] },
          })),
        };
      }),
    }],
  };
  return { text: TEXT, assessment: parseAssessment(json), userAudio, native };
}

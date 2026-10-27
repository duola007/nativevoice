import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { SAMPLE_RATE, floatToInt16, int16ToFloat } from "./audio";

export interface PhonemeResult {
  ipa: string;
  score: number;
  /** What the recognizer most likely heard, when it differs from the target. */
  heardAs?: string;
}

export interface WordResult {
  text: string;
  accuracy: number;
  /** None | Mispronunciation | Omission | Insertion */
  errorType: string;
  /** Seconds into the user's recording. Undefined for omitted words. */
  start?: number;
  end?: number;
  phonemes: PhonemeResult[];
  /** e.g. "Unexpected pause", "Missing pause", "Monotone" */
  prosodyIssues: string[];
}

export interface Assessment {
  recognizedText: string;
  scores: {
    overall: number;
    accuracy: number;
    fluency: number;
    completeness: number;
    prosody?: number;
  };
  words: WordResult[];
}

export interface NativeAudio {
  samples: Float32Array; // 16 kHz mono
  words: { text: string; start: number; end: number }[];
}

const LOCALE = "en-US";
const TICKS_PER_SEC = 10_000_000;

let tokenCache: { token: string; region: string; expires: number } | null = null;

async function speechConfig(): Promise<sdk.SpeechConfig> {
  if (!tokenCache || tokenCache.expires < Date.now()) {
    const r = await fetch("/api/speech-token");
    const body = await r.json();
    if (!r.ok) throw new Error(body.error ?? "Could not get a speech token");
    tokenCache = { ...body, expires: Date.now() + 8 * 60_000 };
  }
  const config = sdk.SpeechConfig.fromAuthorizationToken(tokenCache!.token, tokenCache!.region);
  config.speechRecognitionLanguage = LOCALE;
  return config;
}

/** Scores a finished recording (16 kHz mono) against the text the user meant to say. */
export async function assess(samples: Float32Array, referenceText: string): Promise<Assessment> {
  const config = await speechConfig();
  // Learners pause mid-sentence; don't cut the utterance off at the first gap.
  config.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "3000");

  const format = sdk.AudioStreamFormat.getWaveFormatPCM(SAMPLE_RATE, 16, 1);
  const stream = sdk.AudioInputStream.createPushStream(format);
  stream.write(floatToInt16(samples).buffer as ArrayBuffer);
  stream.close();

  const recognizer = new sdk.SpeechRecognizer(config, sdk.AudioConfig.fromStreamInput(stream));
  const pa = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true,
  );
  pa.phonemeAlphabet = "IPA";
  pa.nbestPhonemeCount = 5;
  pa.enableProsodyAssessment = true;
  pa.applyTo(recognizer);

  try {
    const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) =>
      recognizer.recognizeOnceAsync(resolve, reject),
    );
    if (result.reason === sdk.ResultReason.NoMatch) {
      throw new Error("No speech detected. Check your microphone and try again.");
    }
    if (result.reason === sdk.ResultReason.Canceled) {
      const details = sdk.CancellationDetails.fromResult(result);
      throw new Error(`Assessment canceled: ${details.errorDetails || details.reason}`);
    }
    const json = JSON.parse(
      result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult),
    );
    return parseAssessment(json);
  } finally {
    recognizer.close();
  }
}

// Azure's JSON shape, trimmed to the fields we read.
interface AzureWord {
  Word: string;
  Offset?: number;
  Duration?: number;
  PronunciationAssessment?: {
    AccuracyScore?: number;
    ErrorType?: string;
    Feedback?: {
      Prosody?: {
        Break?: { ErrorTypes?: string[] };
        Intonation?: { ErrorTypes?: string[] };
      };
    };
  };
  Phonemes?: {
    Phoneme: string;
    PronunciationAssessment?: {
      AccuracyScore?: number;
      NBestPhonemes?: { Phoneme: string; Score: number }[];
    };
  }[];
}

const PROSODY_LABELS: Record<string, string> = {
  UnexpectedBreak: "Unexpected pause",
  MissingBreak: "Missing pause",
  Monotone: "Monotone",
};

export function parseAssessment(json: any): Assessment {
  const best = json.NBest?.[0];
  if (!best) throw new Error("Unexpected response from the speech service.");
  const pa = best.PronunciationAssessment ?? {};

  const words: WordResult[] = (best.Words as AzureWord[]).map((w) => {
    const wpa = w.PronunciationAssessment ?? {};
    const errorType = wpa.ErrorType ?? "None";
    const prosody = wpa.Feedback?.Prosody;
    const issues = [
      ...(prosody?.Break?.ErrorTypes ?? []),
      ...(prosody?.Intonation?.ErrorTypes ?? []),
      // Older service versions report breaks as the word's ErrorType.
      ...(PROSODY_LABELS[errorType] ? [errorType] : []),
    ]
      .filter((e) => e in PROSODY_LABELS)
      .map((e) => PROSODY_LABELS[e]);

    const hasTiming = errorType !== "Omission" && w.Offset !== undefined && w.Duration;
    return {
      text: w.Word,
      accuracy: Math.round(wpa.AccuracyScore ?? 0),
      errorType: PROSODY_LABELS[errorType] ? "None" : errorType,
      start: hasTiming ? w.Offset! / TICKS_PER_SEC : undefined,
      end: hasTiming ? (w.Offset! + w.Duration!) / TICKS_PER_SEC : undefined,
      prosodyIssues: [...new Set(issues)],
      phonemes: (w.Phonemes ?? []).map((p) => {
        const score = Math.round(p.PronunciationAssessment?.AccuracyScore ?? 0);
        const top = p.PronunciationAssessment?.NBestPhonemes?.[0]?.Phoneme;
        return {
          ipa: p.Phoneme,
          score,
          heardAs: score < 70 && top && top !== p.Phoneme ? top : undefined,
        };
      }),
    };
  });

  return {
    recognizedText: json.DisplayText ?? "",
    scores: {
      overall: Math.round(pa.PronScore ?? 0),
      accuracy: Math.round(pa.AccuracyScore ?? 0),
      fluency: Math.round(pa.FluencyScore ?? 0),
      completeness: Math.round(pa.CompletenessScore ?? 0),
      prosody: pa.ProsodyScore !== undefined ? Math.round(pa.ProsodyScore) : undefined,
    },
    words,
  };
}

const nativeCache = new Map<string, Promise<NativeAudio>>();

/** Synthesizes a native reference recording, with word timings, at the given speed. */
export function synthesize(text: string, voice: string, rate = 1): Promise<NativeAudio> {
  const key = `${voice}|${rate}|${text}`;
  let cached = nativeCache.get(key);
  if (!cached) {
    cached = doSynthesize(text, voice, rate);
    cached.catch(() => nativeCache.delete(key));
    nativeCache.set(key, cached);
  }
  return cached;
}

async function doSynthesize(text: string, voice: string, rate: number): Promise<NativeAudio> {
  const config = await speechConfig();
  config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;
  const synth = new sdk.SpeechSynthesizer(config, null);
  const words: NativeAudio["words"] = [];
  synth.wordBoundary = (_s, e) => {
    if (e.boundaryType !== sdk.SpeechSynthesisBoundaryType.Word) return;
    const start = e.audioOffset / TICKS_PER_SEC;
    words.push({ text: e.text, start, end: start + e.duration / TICKS_PER_SEC });
  };

  const escaped = text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${LOCALE}">
    <voice name="${voice}"><prosody rate="${Math.round(rate * 100)}%">${escaped}</prosody></voice></speak>`;

  try {
    const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) =>
      synth.speakSsmlAsync(ssml, resolve, reject),
    );
    if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
      throw new Error(`Speech synthesis failed: ${result.errorDetails}`);
    }
    return { samples: int16ToFloat(wavPcm(result.audioData)), words };
  } finally {
    synth.close();
  }
}

/** Extracts the PCM samples from a RIFF/WAV buffer. */
function wavPcm(buf: ArrayBuffer): Int16Array {
  const view = new DataView(buf);
  let pos = 12;
  while (pos + 8 <= buf.byteLength) {
    const id = String.fromCharCode(...new Uint8Array(buf, pos, 4));
    const size = view.getUint32(pos + 4, true);
    if (id === "data") {
      const len = Math.min(size, buf.byteLength - pos - 8);
      return new Int16Array(buf.slice(pos + 8, pos + 8 + len - (len % 2)));
    }
    pos += 8 + size + (size % 2);
  }
  throw new Error("Synthesized audio had no data chunk.");
}

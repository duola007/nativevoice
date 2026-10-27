import Anthropic from "@anthropic-ai/sdk";

/** Compact summary of one attempt, built by the client from the Azure result. */
export interface CoachRequest {
  referenceText: string;
  nativeLanguage: string;
  scores: Record<string, number | undefined>;
  words: {
    word: string;
    accuracy: number;
    errorType: string;
    prosodyIssues: string[];
    phonemes: { ipa: string; score: number; heardAs?: string }[];
  }[];
  /** The learner's historically weakest sounds, e.g. ["θ 52", "ɹ 61"]. */
  weakSounds: string[];
}

export interface CoachResponse {
  headline: string;
  tips: { focus: string; explanation: string; howTo: string; practiceWords: string[] }[];
  nextSentence: string;
  encouragement: string;
}

const SYSTEM = `You are an expert accent coach (American English) with a background in phonetics and speech-language pathology.
You receive machine pronunciation-assessment results for one recording: 0-100 scores per word and per IPA phoneme, and sometimes the phoneme the recognizer actually heard instead ("heardAs").

Give the learner feedback a great human coach would give:
- Pick the 1-3 issues that most hurt intelligibility. Prefer patterns (the same sound wrong in several words) over one-off slips. Ignore phonemes scoring 80+.
- Use what you know about typical transfer errors from the learner's native language to explain *why* the error happens.
- "howTo" must be physical and concrete: tongue, lips, jaw, airflow, voicing, length. One or two short sentences.
- Prosody issues (unexpected pauses, monotone) count too, but only if notable.
- practiceWords: 3-5 short words or minimal pairs isolating the sound.
- nextSentence: one natural sentence (8-14 words) packed with the target sound(s).
- Keep every field brief. Plain language, no IPA jargon without an example word.
If the attempt is excellent, say so and suggest a harder stretch target.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "tips", "nextSentence", "encouragement"],
  properties: {
    headline: { type: "string", description: "One-sentence overall verdict." },
    tips: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["focus", "explanation", "howTo", "practiceWords"],
        properties: {
          focus: { type: "string", description: 'Short label, e.g. "TH in think"' },
          explanation: { type: "string" },
          howTo: { type: "string" },
          practiceWords: { type: "array", items: { type: "string" } },
        },
      },
    },
    nextSentence: { type: "string" },
    encouragement: { type: "string" },
  },
} as const;

const hasAnthropicCreds = () =>
  Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export const coachAvailable = hasAnthropicCreds;

let client: Anthropic | null = null;

export async function coach(req: CoachRequest): Promise<CoachResponse> {
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // Low effort keeps feedback snappy; this is a short, well-specified task.
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(req) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The coach declined to answer this request.");
  }
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Coach returned no text.");
  return JSON.parse(text.text) as CoachResponse;
}

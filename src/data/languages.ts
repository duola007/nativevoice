/**
 * Typical transfer errors by native language. Used to pick starting material
 * before the learner has enough history of their own, and as context for the coach.
 */
export interface L1Profile {
  name: string;
  focus: string[]; // IPA symbols to prioritize
  notes: string;
}

export const LANGUAGES: L1Profile[] = [
  { name: "Mandarin Chinese", focus: ["θ", "ð", "v", "ɹ", "l", "ɪ", "æ", "z"], notes: "TH → s/z, v → w, l/r and l/n mix-ups, dropped or added final consonants, short vs. long vowels, syllable-timed rhythm." },
  { name: "Cantonese", focus: ["θ", "ð", "v", "ɹ", "l", "n", "z", "æ"], notes: "l/n merger, TH → f/d, dropped final consonants, v → w." },
  { name: "Spanish", focus: ["ɪ", "i", "ʃ", "z", "v", "æ", "ʌ", "dʒ"], notes: "ship/sheep merger, v → b, 'e' added before s+consonant ('espeak'), no /z/, sh/ch confusion." },
  { name: "Portuguese", focus: ["ɪ", "i", "θ", "ð", "h", "æ", "ɹ"], notes: "Extra vowel after final consonants, h dropped or rasped, TH → t/d or f." },
  { name: "Hindi", focus: ["v", "w", "θ", "ð", "z", "æ", "ɹ"], notes: "v/w merger, TH → dental t/d, retroflex t/d, z → j, syllable-timed rhythm." },
  { name: "Arabic", focus: ["p", "v", "ɪ", "ɛ", "ʌ", "oʊ", "tʃ"], notes: "p → b, v → f, vowel confusions, extra vowel inside consonant clusters." },
  { name: "Japanese", focus: ["ɹ", "l", "θ", "ð", "v", "æ", "ʌ", "f"], notes: "r/l, extra vowels after consonants, TH → s/z, v → b, f → h." },
  { name: "Korean", focus: ["ɹ", "l", "f", "v", "z", "θ", "ð", "ɪ"], notes: "r/l, f → p, v → b, z → j, extra vowels after final consonants." },
  { name: "Vietnamese", focus: ["θ", "ð", "ʃ", "z", "s", "ɹ"], notes: "Dropped final consonants and clusters, TH → t/d, s/sh confusion." },
  { name: "French", focus: ["θ", "ð", "h", "ɪ", "i", "ɹ"], notes: "TH → s/z, dropped h, ship/sheep, uvular r, even stress on every syllable." },
  { name: "German", focus: ["w", "v", "θ", "ð", "z", "æ", "d"], notes: "w → v, final consonants devoiced (bad → bat), TH → s/z." },
  { name: "Russian", focus: ["θ", "ð", "w", "h", "ɪ", "æ", "ŋ"], notes: "TH → s/z, w → v, h → kh, ship/sheep, final devoicing." },
  { name: "Other", focus: ["θ", "ð", "ɹ", "ɪ", "æ", "v"], notes: "" },
];

export const profileFor = (name: string) => LANGUAGES.find((l) => l.name === name);

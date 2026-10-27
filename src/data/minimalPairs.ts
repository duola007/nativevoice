/** Minimal-pair sets for ear training — you can't fix a contrast you can't hear. */
export interface Contrast {
  id: string;
  label: string;
  sounds: [string, string]; // IPA
  pairs: [string, string][];
}

export const CONTRASTS: Contrast[] = [
  { id: "i-ɪ", label: "sheep vs. ship", sounds: ["i", "ɪ"], pairs: [["sheep", "ship"], ["leave", "live"], ["beat", "bit"], ["seat", "sit"], ["feel", "fill"], ["heel", "hill"], ["reach", "rich"], ["peach", "pitch"]] },
  { id: "θ-s", label: "think vs. sink", sounds: ["θ", "s"], pairs: [["think", "sink"], ["thick", "sick"], ["thumb", "sum"], ["mouth", "mouse"], ["worth", "worse"], ["path", "pass"], ["faith", "face"], ["thigh", "sigh"]] },
  { id: "θ-t", label: "three vs. tree", sounds: ["θ", "t"], pairs: [["three", "tree"], ["thank", "tank"], ["thin", "tin"], ["thought", "taught"], ["both", "boat"], ["math", "mat"], ["tenth", "tent"], ["thorn", "torn"]] },
  { id: "ð-d", label: "they vs. day", sounds: ["ð", "d"], pairs: [["they", "day"], ["then", "den"], ["though", "dough"], ["there", "dare"], ["breathe", "breed"], ["those", "doze"], ["worthy", "wordy"], ["lather", "ladder"]] },
  { id: "ɹ-l", label: "right vs. light", sounds: ["ɹ", "l"], pairs: [["right", "light"], ["road", "load"], ["rock", "lock"], ["grass", "glass"], ["pray", "play"], ["fry", "fly"], ["correct", "collect"], ["arrive", "alive"]] },
  { id: "v-w", label: "vest vs. west", sounds: ["v", "w"], pairs: [["vest", "west"], ["vine", "wine"], ["veil", "whale"], ["verse", "worse"], ["vet", "wet"], ["vow", "wow"], ["viper", "wiper"], ["vent", "went"]] },
  { id: "v-b", label: "very vs. berry", sounds: ["v", "b"], pairs: [["very", "berry"], ["vote", "boat"], ["van", "ban"], ["vest", "best"], ["curve", "curb"], ["vowel", "bowel"], ["vet", "bet"], ["veil", "bale"]] },
  { id: "æ-ɛ", label: "bad vs. bed", sounds: ["æ", "ɛ"], pairs: [["bad", "bed"], ["man", "men"], ["sat", "set"], ["pan", "pen"], ["laughed", "left"], ["had", "head"], ["band", "bend"], ["sad", "said"]] },
  { id: "æ-ʌ", label: "cap vs. cup", sounds: ["æ", "ʌ"], pairs: [["cap", "cup"], ["bat", "but"], ["match", "much"], ["ran", "run"], ["cat", "cut"], ["hang", "hung"], ["track", "truck"], ["fan", "fun"]] },
  { id: "ʊ-u", label: "full vs. fool", sounds: ["ʊ", "u"], pairs: [["full", "fool"], ["pull", "pool"], ["look", "Luke"], ["could", "cooed"], ["should", "shooed"], ["foot", "food"], ["wood", "wooed"], ["stood", "stewed"]] },
  { id: "s-ʃ", label: "see vs. she", sounds: ["s", "ʃ"], pairs: [["see", "she"], ["sip", "ship"], ["sore", "shore"], ["save", "shave"], ["mass", "mash"], ["seat", "sheet"], ["sock", "shock"], ["lease", "leash"]] },
  { id: "n-l", label: "night vs. light", sounds: ["n", "l"], pairs: [["night", "light"], ["no", "low"], ["net", "let"], ["knock", "lock"], ["need", "lead"], ["nine", "line"], ["snow", "slow"], ["nap", "lap"]] },
];

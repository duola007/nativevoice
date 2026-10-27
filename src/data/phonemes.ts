/** Articulation tips for the en-US IPA symbols Azure returns. */
export interface PhonemeInfo {
  example: string;
  tip: string;
}

export const PHONEMES: Record<string, PhonemeInfo> = {
  // Consonants learners most often struggle with
  θ: { example: "think", tip: "Put the tip of your tongue lightly between your teeth and blow air out — no voice. Don't touch the ridge behind your teeth (that makes /s/ or /t/)." },
  ð: { example: "this", tip: "Same tongue position as 'think' (tip between the teeth), but turn your voice on — you should feel a buzz on your tongue." },
  ɹ: { example: "red", tip: "Pull your tongue back and bunch it up; the tip touches nothing. Round your lips slightly. Don't tap or trill." },
  l: { example: "light", tip: "Press the tongue tip firmly on the ridge behind your top teeth and let air flow around the sides. At the end of words ('feel'), also raise the back of the tongue." },
  v: { example: "very", tip: "Rest your top teeth on your lower lip and push voiced air through — feel the lip buzz. Lips don't round (that's /w/), and they don't touch each other (that's /b/)." },
  w: { example: "west", tip: "Round your lips into a tight circle, no teeth touching, then glide open into the vowel." },
  f: { example: "fine", tip: "Top teeth lightly on the lower lip, blow air with no voice. Both lips don't close (that's /p/)." },
  z: { example: "zoo", tip: "Like /s/ but with your voice on — you should hear a buzz. Many final 's' letters are /z/: 'dogs', 'is', 'was'." },
  s: { example: "see", tip: "Tongue tip close to (not touching) the ridge behind your top teeth; push a thin stream of air through." },
  ʃ: { example: "she", tip: "Round your lips forward and pull your tongue slightly back from the /s/ position for a wider, 'hushing' sound." },
  ʒ: { example: "measure", tip: "Same as 'she' but voiced — add a buzz. Keep it smooth; don't turn it into 'j' as in 'jam'." },
  tʃ: { example: "church", tip: "Start with the tongue blocking air at the ridge (like /t/), then release into 'sh'." },
  dʒ: { example: "judge", tip: "Like 'ch' but voiced: block with the tongue, then release into a buzzing 'zh'." },
  ŋ: { example: "sing", tip: "Raise the back of the tongue to the soft palate and hum through your nose. Don't add a /g/ at the end: 'sing', not 'sin-g'." },
  n: { example: "no", tip: "Tongue tip on the ridge behind your top teeth, air through the nose. Keep it distinct from /l/ and /ŋ/." },
  h: { example: "hat", tip: "Just a soft breath out from an open throat — no scraping in the back of the throat." },
  j: { example: "yes", tip: "Raise the middle of the tongue toward the hard palate, then glide into the vowel." },
  t: { example: "top", tip: "At the start of a stressed syllable, release /t/ with a strong puff of air. Between vowels in American English ('water') it becomes a quick tap." },
  d: { example: "day", tip: "Tongue tip on the ridge, voice on. At the end of words ('bed'), keep it voiced and make the vowel before it longer." },
  p: { example: "pen", tip: "Close both lips and release with a strong puff of air at the start of stressed syllables." },
  b: { example: "boy", tip: "Close both lips with your voice on; less air puff than /p/." },
  k: { example: "cat", tip: "Back of tongue on the soft palate; release with a puff of air at the start of stressed syllables." },
  ɡ: { example: "go", tip: "Back of tongue on the soft palate with voice on. At word ends ('bag'), lengthen the vowel before it." },
  g: { example: "go", tip: "Back of tongue on the soft palate with voice on. At word ends ('bag'), lengthen the vowel before it." },
  m: { example: "man", tip: "Close your lips and hum. Make sure final /m/ ('them') is fully closed, not turned into /n/." },
  // Vowels
  i: { example: "sheep", tip: "Long and tense: spread your lips into a slight smile, tongue high and forward. Hold it a little longer than you think." },
  ɪ: { example: "ship", tip: "Short and relaxed: drop your jaw slightly from 'sheep' and loosen your lips. Keep it quick." },
  eɪ: { example: "day", tip: "Start at 'e' as in 'bed' and glide up to 'ee' — it's two sounds, not a flat 'e'." },
  ɛ: { example: "bed", tip: "Jaw half open, tongue in the middle-front. Don't glide into 'ay'." },
  æ: { example: "cat", tip: "Drop your jaw a lot and spread your lips; tongue low and forward. It's wider than the 'e' in 'bed'." },
  ɑ: { example: "father", tip: "Open your mouth wide, tongue low and back, lips relaxed (not rounded)." },
  ʌ: { example: "cup", tip: "Short, relaxed, mid-central: jaw slightly open and lips neutral, like a quick 'uh'." },
  ɔ: { example: "thought", tip: "Jaw open with lips slightly rounded. (Many Americans merge this with the 'a' in 'father'.)" },
  oʊ: { example: "go", tip: "Start with a rounded 'o' and glide your lips tighter toward 'oo'." },
  ʊ: { example: "book", tip: "Short and relaxed with loosely rounded lips — shorter and looser than 'food'." },
  u: { example: "food", tip: "Long and tense: round your lips tightly, tongue high and back." },
  ə: { example: "about", tip: "The schwa: a very short, weak 'uh' in unstressed syllables. Reduce it — don't pronounce the full spelled vowel." },
  ɝ: { example: "bird", tip: "Bunch your tongue like American /r/ and hold it as the vowel itself. No separate vowel before the 'r'." },
  ɚ: { example: "teacher", tip: "An unstressed r-colored schwa: bunch the tongue back briefly. Don't drop the 'r' or add a full vowel." },
  ər: { example: "teacher", tip: "An unstressed r-colored schwa: bunch the tongue back briefly. Don't drop the 'r' or add a full vowel." },
  aɪ: { example: "my", tip: "Start with an open 'ah' and glide up to 'ee'." },
  aʊ: { example: "now", tip: "Start with an open 'ah' and glide into rounded 'oo'." },
  ɔɪ: { example: "boy", tip: "Start with rounded 'aw' and glide to 'ee'." },
};

/** Specific advice for common target → heard confusions. */
export const CONFUSION_TIPS: Record<string, string> = {
  "θ>s": "Your tongue is behind your teeth. Move the tip forward until it peeks out between your teeth.",
  "θ>t": "You're stopping the air. Keep the tongue between the teeth and let air flow continuously.",
  "θ>f": "You're using your lip. The lip stays away — the tongue makes this sound.",
  "ð>d": "You're stopping the air. Let it flow continuously over the tongue between your teeth, with voice.",
  "ð>z": "Tongue is too far back. Bring the tip forward between your teeth.",
  "ɹ>l": "Your tongue tip is touching the roof of your mouth. Pull it back so it touches nothing.",
  "l>ɹ": "Let the tongue tip actually press the ridge behind your top teeth.",
  "l>n": "Air is going through your nose. Keep the tongue on the ridge and let air escape around its sides.",
  "v>w": "Your lips are rounding. Use your top teeth on your lower lip instead.",
  "v>b": "Your lips are closing. Only teeth-on-lip, with air flowing continuously.",
  "v>f": "Turn on your voice — feel your lip vibrate.",
  "w>v": "Your teeth are touching your lip. Round both lips and keep the teeth out of the way.",
  "i>ɪ": "Too short and lax. Smile slightly and hold it longer.",
  "ɪ>i": "Too long and tense. Relax and shorten it.",
  "æ>ɛ": "Open your jaw more — much wider than 'bed'.",
  "ɛ>æ": "Your jaw is too open. Close it a little.",
  "z>s": "Turn your voice on — you should feel a buzz in your throat.",
  "ʊ>u": "Too long and tight. Relax your lips and keep it short.",
  "u>ʊ": "Round your lips more tightly and lengthen the vowel.",
  "ʃ>s": "Round your lips forward and pull the tongue back slightly.",
  "n>ŋ": "Use the tongue tip at the front, not the back of the tongue.",
  "ŋ>n": "Lift the back of the tongue instead of the tip.",
};

export const phonemeLabel = (ipa: string) => {
  const info = PHONEMES[ipa];
  return info ? `/${ipa}/ as in “${info.example}”` : `/${ipa}/`;
};

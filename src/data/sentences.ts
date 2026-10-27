/** Practice sentences tagged with the sounds they concentrate on. */
export interface Sentence {
  text: string;
  focus: string[];
  level: 1 | 2 | 3;
}

export const SENTENCES: Sentence[] = [
  // TH
  { text: "I think three of them are thirsty.", focus: ["θ", "ð"], level: 1 },
  { text: "Thank you for the thoughtful birthday gift.", focus: ["θ", "ð"], level: 1 },
  { text: "Their mother and father gathered together on Thursday.", focus: ["ð", "θ"], level: 2 },
  { text: "The theater is further north than the bath house.", focus: ["θ", "ð", "ɝ"], level: 2 },
  { text: "Although they thought it through, there was nothing else to say.", focus: ["θ", "ð"], level: 3 },
  // R / L
  { text: "Please read the red letter really slowly.", focus: ["ɹ", "l"], level: 1 },
  { text: "The little girl lost her yellow umbrella.", focus: ["l", "ɝ", "ɹ"], level: 2 },
  { text: "Laura rarely arrives late for the library lecture.", focus: ["ɹ", "l"], level: 2 },
  { text: "The brilliant researcher carefully reviewed the rural election results.", focus: ["ɹ", "l"], level: 3 },
  // V / W / F
  { text: "We visited a very lovely village in the valley.", focus: ["v", "w"], level: 1 },
  { text: "Victor wore a woolen vest every winter.", focus: ["v", "w"], level: 2 },
  { text: "Five fine violins were delivered to the festival.", focus: ["f", "v", "w"], level: 2 },
  { text: "We were wondering whether the van would arrive on Wednesday.", focus: ["w", "v"], level: 3 },
  // Short vs long vowels
  { text: "Please sit in this seat and eat the fish.", focus: ["i", "ɪ"], level: 1 },
  { text: "The sheep on the ship will leave the river.", focus: ["i", "ɪ"], level: 1 },
  { text: "The black cat sat on a bad mat.", focus: ["æ"], level: 1 },
  { text: "My friend left the pen on the bed next to the bag.", focus: ["ɛ", "æ"], level: 2 },
  { text: "He took a good look at the cook book.", focus: ["ʊ", "u"], level: 2 },
  { text: "Pull the wool off the pool and choose a few foods.", focus: ["ʊ", "u"], level: 3 },
  { text: "Come up for some fun in the sun on Monday.", focus: ["ʌ"], level: 1 },
  // S / Z / SH / CH / J
  { text: "She sells sea shells by the sea shore.", focus: ["ʃ", "s"], level: 2 },
  { text: "The dogs and cats were his favorite things.", focus: ["z"], level: 1 },
  { text: "Usually I measure the treasure with pleasure.", focus: ["ʒ"], level: 2 },
  { text: "Which chair did John choose for the judge?", focus: ["tʃ", "dʒ"], level: 2 },
  // NG / final consonants
  { text: "She was singing a long song in the morning.", focus: ["ŋ"], level: 1 },
  { text: "He asked for the best desk and helped himself.", focus: ["s", "t", "k"], level: 3 },
  // H
  { text: "Harry hurried home to have a hot meal.", focus: ["h"], level: 1 },
  // Everyday / rhythm & intonation
  { text: "Could you tell me how to get to the train station?", focus: ["t", "eɪ"], level: 1 },
  { text: "I'd like a medium coffee with oat milk, please.", focus: ["l", "oʊ"], level: 1 },
  { text: "Let me share my screen and walk you through the results.", focus: ["ɹ", "ʃ", "w"], level: 2 },
  { text: "What do you think about moving the meeting to Thursday afternoon?", focus: ["θ", "ɝ"], level: 2 },
  { text: "I really appreciate you taking the time to meet with me today.", focus: ["ɹ", "i", "eɪ"], level: 2 },
  { text: "Our quarterly revenue grew faster than we originally anticipated.", focus: ["ɹ", "l", "v"], level: 3 },
  { text: "Thank you all for coming; let's get started with the first item on the agenda.", focus: ["θ", "ɝ", "æ"], level: 3 },
];

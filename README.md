# SpeakWell — American English pronunciation coach

A web prototype of a pronunciation trainer: record a sentence, get a score for every sound,
see your intonation against a native speaker's, and get coaching on what to fix.

## Features

- **Scores for every sound** (Azure Pronunciation Assessment): overall / accuracy / fluency / completeness / prosody, color-coded per word; tap a word to see each IPA sound's score.
- **"Sounded like…"**: when a sound is off, shows which sound came out instead (e.g. /θ/ → /s/) and gives advice specific to that swap.
- **Intonation chart**: your pitch over a native speaker's, time-aligned word by word so different speaking speeds still line up.
- **Play your word next to the native word**, and the full sentence at normal or slow speed.
- **Personalized practice**: sentences are picked to target your historically weakest sounds (or, at first, the typical difficulties of your native language). You can also paste your own text.
- **Ear training**: minimal-pair listening drills (ship/sheep, light/right, vest/west…) with rotating voices.
- **Progress**: weakest sounds, your most frequent sound swaps, score trend, ear-training accuracy (stored in your browser).
- **AI coach** (optional, Claude): explains *why* the errors happen for speakers of your native language, gives physical how-to instructions, and writes a next sentence for you.

## Setup

```bash
npm install
cp .env.example .env   # then fill in the keys
npm run dev            # http://localhost:5173
```

- `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION`: create a **Speech service** resource in the Azure portal (the free F0 tier works). Prosody scoring requires en-US, which the app uses.
- `ANTHROPIC_API_KEY` (optional): turns on the AI coach.

Keys stay on the server: the browser only receives short-lived Azure tokens, and coaching requests go through `/api/coach`.

Without keys you can preview the results screen with sample data at <http://localhost:5173/?demo> (dev only).

Production: `npm run build && npm start` (Express serves `dist/` on `PORT`, default 3001).

## Code map

| Path | What |
|---|---|
| `server/index.ts` | Express: Azure token endpoint, config, static hosting |
| `server/coach.ts` | Claude coaching call (structured JSON output) |
| `src/lib/azure.ts` | Pronunciation assessment + speech synthesis with word timings |
| `src/lib/audio.ts` | Mic capture (AudioWorklet → 16 kHz), playback of clips |
| `src/lib/pitch.ts` | YIN pitch tracking + word-anchored time warping |
| `src/lib/align.ts` | Matches assessed words to the native audio's words |
| `src/lib/progress.ts` | Local history, weak-sound and confusion stats |
| `src/data/*` | Sound tips, native-language profiles, sentences, minimal pairs |
| `src/components/*` | Practice, Results, PitchChart, Coach, EarTraining, ProgressView |

## Ideas for next steps

- Voice conversion: replay the learner's *own voice* with corrected pronunciation.
- AI role-play conversations (interviews, meetings) with pronunciation notes afterward.
- Mouth/tongue animations for each sound; syllable-level stress feedback.
- Accounts + cloud sync, spaced-repetition scheduling, mobile app (React Native / Capacitor).

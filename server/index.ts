import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coach, coachAvailable, type CoachRequest } from "./coach";

const app = express();
app.use(express.json({ limit: "1mb" }));

const { AZURE_SPEECH_KEY, AZURE_SPEECH_REGION } = process.env;
const PORT = Number(process.env.PORT ?? 3001);

// Azure tokens live 10 minutes; reuse one for 9 so the browser never sees the key.
let cachedToken: { token: string; expires: number } | null = null;

app.get("/api/config", (_req, res) => {
  res.json({
    azure: Boolean(AZURE_SPEECH_KEY && AZURE_SPEECH_REGION),
    coach: coachAvailable(),
  });
});

app.get("/api/speech-token", async (_req, res) => {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    res.status(503).json({ error: "AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are not set." });
    return;
  }
  if (cachedToken && cachedToken.expires > Date.now()) {
    res.json({ token: cachedToken.token, region: AZURE_SPEECH_REGION });
    return;
  }
  try {
    const r = await fetch(
      `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: "POST", headers: { "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY } },
    );
    if (!r.ok) throw new Error(`Azure token request failed: ${r.status} ${await r.text()}`);
    const token = await r.text();
    cachedToken = { token, expires: Date.now() + 9 * 60_000 };
    res.json({ token, region: AZURE_SPEECH_REGION });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

app.post("/api/coach", async (req, res) => {
  if (!coachAvailable()) {
    res.status(503).json({ error: "ANTHROPIC_API_KEY is not set." });
    return;
  }
  try {
    res.json(await coach(req.body as CoachRequest));
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`SpeakWell API on http://localhost:${PORT}`);
  if (!AZURE_SPEECH_KEY) console.warn("⚠ AZURE_SPEECH_KEY not set — copy .env.example to .env");
});

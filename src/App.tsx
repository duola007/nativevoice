import { useCallback, useEffect, useState } from "react";
import { Practice } from "./components/Practice";
import { EarTraining } from "./components/EarTraining";
import { ProgressView } from "./components/ProgressView";
import { LANGUAGES } from "./data/languages";
import { VOICES } from "./data/voices";
import { isDemo } from "./dev/demo";
import { loadProgress, loadSettings, saveProgress, saveSettings, type Progress, type Settings } from "./lib/progress";

type Tab = "practice" | "ear" | "progress";

export function App() {
  const [config, setConfig] = useState<{ azure: boolean; coach: boolean } | null>(null);
  const [configError, setConfigError] = useState(false);
  const [tab, setTab] = useState<Tab>("practice");
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [progress, setProgressState] = useState<Progress>(loadProgress);
  const [focus, setFocus] = useState<string[] | null>(null);

  useEffect(() => {
    // Retry briefly: in dev the page can load before the API server is up.
    const load = (tries: number) =>
      fetch("/api/config")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setConfig)
        .catch(() => (tries > 1 ? setTimeout(() => load(tries - 1), 1000) : setConfigError(true)));
    load(5);
  }, []);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveProgress(progress), [progress]);

  const setProgress = useCallback((fn: (p: Progress) => Progress) => setProgressState(fn), []);
  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo">◐</span> SpeakWell
        </div>
        <nav className="tabs">
          {([["practice", "Practice"], ["ear", "Ear training"], ["progress", "Progress"]] as const).map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <div className="settings">
          <label>
            <span>Native language</span>
            <select value={settings.nativeLanguage} onChange={(e) => update({ nativeLanguage: e.target.value })}>
              <option value="">Choose…</option>
              {LANGUAGES.map((l) => <option key={l.name}>{l.name}</option>)}
            </select>
          </label>
          <label>
            <span>Model voice</span>
            <select value={settings.voice} onChange={(e) => update({ voice: e.target.value })}>
              {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
        </div>
      </header>

      <main>
        {configError ? (
          <Setup reason="The API server isn't reachable. Start it with npm run dev." />
        ) : !config ? null : !config.azure && !isDemo ? (
          <Setup reason="Azure Speech isn't configured yet." />
        ) : tab === "practice" ? (
          <Practice
            settings={settings}
            progress={progress}
            setProgress={setProgress}
            coachEnabled={config.coach}
            focus={focus}
            setFocus={setFocus}
          />
        ) : tab === "ear" ? (
          <EarTraining settings={settings} progress={progress} setProgress={setProgress} />
        ) : (
          <ProgressView
            progress={progress}
            setProgress={setProgress}
            onPracticeSound={(ipa) => {
              setFocus([ipa]);
              setTab("practice");
            }}
          />
        )}
      </main>
    </div>
  );
}

function Setup({ reason }: { reason: string }) {
  return (
    <section className="card setup">
      <h3>Setup needed</h3>
      <p>{reason}</p>
      <ol>
        <li>In the Azure portal, create a <b>Speech service</b> resource (the free F0 tier is enough).</li>
        <li>Copy <code>.env.example</code> to <code>.env</code> and fill in <code>AZURE_SPEECH_KEY</code> and <code>AZURE_SPEECH_REGION</code>.</li>
        <li>Optionally add <code>ANTHROPIC_API_KEY</code> to turn on the AI coach.</li>
        <li>Restart <code>npm run dev</code> and reload this page.</li>
      </ol>
    </section>
  );
}

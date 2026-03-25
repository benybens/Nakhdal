import { useEffect, useMemo, useState } from "react";
import { modules, subModules } from "./domain/modules";
import { Home } from "./pages/Home";
import { primeFeedbackAudio, setUiFeedbackVolume } from "./logic/feedbackSound";
import { ModulePage } from "./pages/ModulePage";
import { TrainingPage } from "./pages/TrainingPage";
import { clearProgress, createDefaultProgress, getWeakWords, loadProgress, saveProgress, type ProgressStoreState } from "./store/progressStore";

type Route =
  | { name: "home" }
  | { name: "module"; subModuleId: string }
  | { name: "training" };

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "nahdar_theme";
const UI_VOLUME_STORAGE_KEY = "nahdar_ui_volume";
const DEFAULT_UI_VOLUME = 0.8;

const parseRoute = (): Route => {
  const hash = window.location.hash.replace("#", "");

  if (hash.startsWith("/modules/")) {
    return {
      name: "module",
      subModuleId: hash.replace("/modules/", ""),
    };
  }

  if (hash === "/training") {
    return { name: "training" };
  }

  return { name: "home" };
};

const navigateTo = (route: Route) => {
  if (route.name === "home") {
    window.location.hash = "/";
    return;
  }

  if (route.name === "training") {
    window.location.hash = "/training";
    return;
  }

  window.location.hash = `/modules/${route.subModuleId}`;
};

const loadTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const loadUiVolume = () => {
  if (typeof window === "undefined") {
    return DEFAULT_UI_VOLUME;
  }

  const savedVolume = Number(window.localStorage.getItem(UI_VOLUME_STORAGE_KEY));
  if (Number.isFinite(savedVolume)) {
    return Math.max(0, Math.min(1, savedVolume));
  }

  return DEFAULT_UI_VOLUME;
};

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [progress, setProgress] = useState<ProgressStoreState>(() => loadProgress());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [uiVolume, setUiVolume] = useState(() => loadUiVolume());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setUiFeedbackVolume(uiVolume);
    window.localStorage.setItem(UI_VOLUME_STORAGE_KEY, String(uiVolume));
  }, [uiVolume]);

  useEffect(() => {
    const unlockAudio = () => {
      primeFeedbackAudio();
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const selectedSubModule = useMemo(() => {
    if (route.name !== "module") {
      return null;
    }

    return subModules.find((subModule) => subModule.id === route.subModuleId) ?? null;
  }, [route]);

  const selectedSubModuleIndex = useMemo(() => {
    if (!selectedSubModule) {
      return -1;
    }

    return subModules.findIndex((subModule) => subModule.id === selectedSubModule.id);
  }, [selectedSubModule]);

  const nextSubModule = selectedSubModuleIndex >= 0 ? subModules[selectedSubModuleIndex + 1] ?? null : null;
  const canStartTraining = getWeakWords(progress).length > 0 || Object.keys(progress.words).length > 0;

  const handleResetApp = () => {
    if (!window.confirm("Effacer toute ta progression et remettre l'app comme neuve ?")) {
      return;
    }

    clearProgress();
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    window.localStorage.removeItem(UI_VOLUME_STORAGE_KEY);

    const nextTheme = loadTheme();
    setProgress(createDefaultProgress());
    setTheme(nextTheme);
    setUiVolume(DEFAULT_UI_VOLUME);
    setUiFeedbackVolume(DEFAULT_UI_VOLUME);
    setSettingsOpen(false);
    window.location.hash = "/";
    setRoute({ name: "home" });
  };

  let content;

  if (route.name === "module" && selectedSubModule) {
    content = (
      <ModulePage
        nextSubModule={nextSubModule}
        onBack={() => navigateTo({ name: "home" })}
        onGoToModuleTraining={() => navigateTo({ name: "module", subModuleId: selectedSubModule.id })}
        onGoToNextModule={nextSubModule ? () => navigateTo({ name: "module", subModuleId: nextSubModule.id }) : undefined}
        onProgressChange={setProgress}
        progress={progress}
        subModule={selectedSubModule}
      />
    );
  } else if (route.name === "training") {
    content = <TrainingPage onBack={() => navigateTo({ name: "home" })} onProgressChange={setProgress} progress={progress} />;
  } else {
    content = (
      <Home
        canStartTraining={canStartTraining}
        modules={modules}
        onOpenLesson={(subModuleId) => navigateTo({ name: "module", subModuleId })}
        onOpenTraining={() => navigateTo({ name: "training" })}
        progress={progress}
      />
    );
  }

  return (
    <>
      <div className="settings-anchor">
        <button className="settings-button" onClick={() => setSettingsOpen(true)} type="button">
          <span className="settings-button__icon" aria-hidden="true">⚙</span>
          <span>Paramètres</span>
        </button>
      </div>

      {content}

      {settingsOpen ? (
        <div className="settings-modal-backdrop" onClick={() => setSettingsOpen(false)} role="presentation">
          <section
            aria-labelledby="settings-title"
            className="settings-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="settings-modal__header">
              <div>
                <p className="page-kicker">Paramètres</p>
                <h2 id="settings-title">Un petit réglage</h2>
              </div>
              <button className="secondary-button" onClick={() => setSettingsOpen(false)} type="button">
                Fermer
              </button>
            </div>

            <div className="settings-option">
              <div>
                <h3>Thème</h3>
                <p>Choisis l'ambiance qui te va le mieux.</p>
              </div>
              <div className="theme-switcher">
                <button
                  className={`theme-chip ${theme === "light" ? "theme-chip--active" : ""}`}
                  onClick={() => setTheme("light")}
                  type="button"
                >
                  Clair
                </button>
                <button
                  className={`theme-chip ${theme === "dark" ? "theme-chip--active" : ""}`}
                  onClick={() => setTheme("dark")}
                  type="button"
                >
                  Sombre
                </button>
              </div>
            </div>

            <div className="settings-option">
              <div>
                <h3>Volume UI</h3>
                <p>Règle le volume des sons d'interface et de validation.</p>
              </div>
              <div className="settings-range">
                <input
                  aria-label="Volume des sons d'interface"
                  max="100"
                  min="0"
                  onChange={(event) => setUiVolume(Number(event.target.value) / 100)}
                  type="range"
                  value={Math.round(uiVolume * 100)}
                />
                <strong className="settings-value">{Math.round(uiVolume * 100)}%</strong>
              </div>
            </div>

            <div className="settings-option">
              <div>
                <h3>Réinitialiser l'app</h3>
                <p>Efface la progression, les mots révisés, le thème et le volume enregistrés sur cet appareil.</p>
              </div>
              <button className="secondary-button settings-danger-button" onClick={handleResetApp} type="button">
                Réinitialiser complètement
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default App;

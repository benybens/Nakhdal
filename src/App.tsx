import { useEffect, useMemo, useState } from "react";
import { modules } from "./data/modules";
import { Home } from "./pages/Home";
import { ModulePage } from "./pages/ModulePage";
import { TrainingPage } from "./pages/TrainingPage";
import { loadProgress, saveProgress } from "./store/progressStore";
import { UserProgress } from "./types";

type Route =
  | { name: "home" }
  | { name: "module"; moduleId: string }
  | { name: "module-training"; moduleId: string }
  | { name: "training" };

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "nahdar_theme";

const parseRoute = (): Route => {
  const hash = window.location.hash.replace("#", "");

  if (hash.startsWith("/module-training/")) {
    return {
      name: "module-training",
      moduleId: hash.replace("/module-training/", ""),
    };
  }

  if (hash.startsWith("/modules/")) {
    return {
      name: "module",
      moduleId: hash.replace("/modules/", ""),
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

  if (route.name === "module-training") {
    window.location.hash = `/module-training/${route.moduleId}`;
    return;
  }

  window.location.hash = `/modules/${route.moduleId}`;
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

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
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

  const selectedModule = useMemo(() => {
    if (route.name !== "module" && route.name !== "module-training") {
      return null;
    }

    return modules.find((module) => module.id === route.moduleId) ?? null;
  }, [route]);

  useEffect(() => {
    if (route.name !== "module") {
      return;
    }

    console.log("[Nahdar][App] Opening module route", {
      route,
      selectedModuleId: selectedModule?.id ?? null,
      selectedModuleTitle: selectedModule?.title ?? null,
      selectedModuleWordCount: selectedModule?.words.length ?? 0,
      selectedModuleWords:
        selectedModule?.words.map((word) => ({
          dz: word.dz,
          fr: word.fr,
        })) ?? [],
    });
  }, [route, selectedModule]);

  const selectedModuleIndex = useMemo(() => {
    if (!selectedModule) {
      return -1;
    }

    return modules.findIndex((module) => module.id === selectedModule.id);
  }, [selectedModule]);

  const nextModule = selectedModuleIndex >= 0 ? modules[selectedModuleIndex + 1] ?? null : null;
  const trainingWords = progress.revisionWords;

  let content;

  if (route.name === "module" && selectedModule) {
    content = (
      <ModulePage
        module={selectedModule}
        nextModule={nextModule}
        onBack={() => navigateTo({ name: "home" })}
        onGoToModuleTraining={() => navigateTo({ name: "module-training", moduleId: selectedModule.id })}
        onGoToNextModule={nextModule ? () => navigateTo({ name: "module", moduleId: nextModule.id }) : undefined}
        onProgressChange={setProgress}
        progress={progress}
      />
    );
  } else if (route.name === "module-training" && selectedModule) {
    content = (
      <TrainingPage
        kicker="Révision du module"
        onBack={() => navigateTo({ name: "module", moduleId: selectedModule.id })}
        title={selectedModule.title}
        words={selectedModule.words}
      />
    );
  } else if (route.name === "training" && trainingWords.length > 0) {
    content = <TrainingPage onBack={() => navigateTo({ name: "home" })} words={trainingWords} />;
  } else {
    content = (
      <Home
        canStartTraining={trainingWords.length > 0}
        modules={modules}
        onOpenModule={(moduleId) => navigateTo({ name: "module", moduleId })}
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
          </section>
        </div>
      ) : null}
    </>
  );
}

export default App;
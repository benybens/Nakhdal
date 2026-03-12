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
  | { name: "training" };

const parseRoute = (): Route => {
  const hash = window.location.hash.replace("#", "");

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

  window.location.hash = `/modules/${route.moduleId}`;
};

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const selectedModule = useMemo(() => {
    if (route.name !== "module") {
      return null;
    }

    return modules.find((module) => module.id === route.moduleId) ?? null;
  }, [route]);

  const trainingWords = progress.revisionWords;

  if (route.name === "module" && selectedModule) {
    return (
      <ModulePage
        module={selectedModule}
        onBack={() => navigateTo({ name: "home" })}
        onProgressChange={setProgress}
        progress={progress}
      />
    );
  }

  if (route.name === "training" && trainingWords.length > 0) {
    return <TrainingPage onBack={() => navigateTo({ name: "home" })} words={trainingWords} />;
  }

  return (
    <Home
      canStartTraining={trainingWords.length > 0}
      modules={modules}
      onOpenModule={(moduleId) => navigateTo({ name: "module", moduleId })}
      onOpenTraining={() => navigateTo({ name: "training" })}
      progress={progress}
    />
  );
}

export default App;

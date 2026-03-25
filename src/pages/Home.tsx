import { useState } from "react";
import { ModuleCard } from "../components/ModuleCard";
import { getSubModulesForModule, getWordIdsForSubModule } from "../domain/modules";
import type { ProgressStoreState } from "../store/progressStore";
import type { Module } from "../types/learning";

type HomeProps = {
  modules: Module[];
  progress: ProgressStoreState;
  canStartTraining: boolean;
  onOpenLesson: (subModuleId: string) => void;
  onOpenTraining: () => void;
};

export const Home = ({
  modules,
  progress,
  canStartTraining,
  onOpenLesson,
  onOpenTraining,
}: HomeProps) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (moduleId: string) => {
    setExpandedModules((current) => ({
      ...current,
      [moduleId]: !current[moduleId],
    }));
  };

  return (
    <div className="page-shell">
      <header className="hero">
        <p className="page-kicker">Nahdar</p>
        <h1>Tu commences à parler algérien sans t'en rendre compte</h1>
        <p className="hero-copy">
          Des mots du quotidien, thème par thème, puis une révision qui tourne sans fin.
        </p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Par où on commence ?</h2>
          <span className="section-note">Choisis un module, puis avance sous-module par sous-module.</span>
        </div>

        <div className="lesson-list">
          {modules.map((moduleGroup) => {
            const isExpanded = expandedModules[moduleGroup.id] ?? false;
            const moduleSubModules = getSubModulesForModule(moduleGroup.id);
            const completedSubModules = moduleSubModules.filter((subModule) => {
              const wordIds = getWordIdsForSubModule(subModule.id);
              return wordIds.length > 0 && wordIds.every((wordId) => (progress.words[wordId]?.mastery_level ?? 0) >= 3);
            }).length;
            const exploredSubModules = moduleSubModules.filter((subModule) => {
              const wordIds = getWordIdsForSubModule(subModule.id);
              return wordIds.some((wordId) => Boolean(progress.words[wordId]));
            }).length;
            const isCompleted = moduleSubModules.length > 0 && completedSubModules === moduleSubModules.length;

            let moduleProgressLabel = "Pas encore exploré";
            if (isCompleted) {
              moduleProgressLabel = "Tous les sous-modules sont terminés";
            } else if (exploredSubModules > 0) {
              moduleProgressLabel = `Tu as déjà ouvert ${exploredSubModules} sous-module${exploredSubModules > 1 ? "s" : ""} sur ${moduleSubModules.length}`;
            }

            return (
              <section
                className={`lesson-group ${isCompleted ? "lesson-group--completed" : ""}`.trim()}
                key={moduleGroup.id}
              >
                <button
                  aria-expanded={isExpanded}
                  className={`lesson-toggle ${isCompleted ? "lesson-toggle--completed" : ""}`.trim()}
                  onClick={() => toggleModule(moduleGroup.id)}
                  type="button"
                >
                  <span>
                    <span className="lesson-toggle__title">{moduleGroup.name}</span>
                    <span className="lesson-toggle__meta">{moduleProgressLabel}</span>
                  </span>
                  <span className={`lesson-toggle__chevron ${isExpanded ? "lesson-toggle__chevron--open" : ""}`}>
                    v
                  </span>
                </button>

                {isExpanded ? (
                  <div className="lesson-submodules">
                    {moduleSubModules.map((subModule, index) => {
                      const wordIds = getWordIdsForSubModule(subModule.id);
                      const knownWords = wordIds.filter((wordId) => (progress.words[wordId]?.mastery_level ?? 0) >= 3).length;
                      const totalWords = wordIds.length;
                      const completionPercent = totalWords > 0 ? Math.round((knownWords / totalWords) * 100) : 0;
                      const isCompleted = totalWords > 0 && knownWords === totalWords;
                      const progressLabel = isCompleted
                        ? "Terminé"
                        : `${knownWords} / ${totalWords} mots • ${completionPercent}%`;

                      return (
                        <ModuleCard
                          key={subModule.id}
                          isCompleted={isCompleted}
                          module={subModule}
                          onOpen={() => onOpenLesson(subModule.id)}
                          progressLabel={`Sous-module ${index + 1} • ${progressLabel}`}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </section>

      <section className="panel panel--compact">
        <div className="section-heading">
          <h2>Le coin révision</h2>
          <span className="section-note">
            {canStartTraining
              ? "Encore un tour ?"
              : "Continue tes sous-modules pour lancer l'entraînement global."}
          </span>
        </div>
        <button
          className="primary-button"
          disabled={!canStartTraining}
          onClick={onOpenTraining}
          type="button"
        >
          Continuer
        </button>
      </section>
    </div>
  );
};

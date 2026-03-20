import { useMemo, useState } from "react";
import { ModuleCard } from "../components/ModuleCard";
import { getModuleMasteredCount, isModuleCompleted } from "../logic/trainingEngine";
import { getModuleProgress } from "../store/progressStore";
import { UserProgress, VocabularyLesson, VocabularyModule } from "../types";

type HomeProps = {
  modules: VocabularyModule[];
  progress: UserProgress;
  canStartTraining: boolean;
  onOpenLesson: (lessonId: string) => void;
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
          <span className="section-note">Choisis un module, puis avance leçon par leçon.</span>
        </div>

        <div className="lesson-list">
          {modules.map((moduleGroup) => {
            const isExpanded = expandedModules[moduleGroup.id] ?? false;
            const completedLessons = moduleGroup.lessons.filter((lesson: VocabularyLesson) =>
              isModuleCompleted(lesson, progress),
            ).length;
            const isCompleted = completedLessons === moduleGroup.lessons.length;
            const exploredLessons = moduleGroup.lessons.filter((lesson: VocabularyLesson) => {
              const lessonProgress = getModuleProgress(progress, lesson);
              return Object.keys(lessonProgress.wordStats).length > 0;
            }).length;

            let moduleProgressLabel = "Pas encore exploré";
            if (isCompleted) {
              moduleProgressLabel = "Toutes les leçons sont terminées";
            } else if (exploredLessons > 0) {
              moduleProgressLabel = `Tu as déjà ouvert ${exploredLessons} leçon${exploredLessons > 1 ? "s" : ""} sur ${moduleGroup.lessons.length}`;
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
                    <span className="lesson-toggle__title">{moduleGroup.title}</span>
                    <span className="lesson-toggle__meta">{moduleProgressLabel}</span>
                  </span>
                  <span className={`lesson-toggle__chevron ${isExpanded ? "lesson-toggle__chevron--open" : ""}`}>
                    v
                  </span>
                </button>

                {isExpanded ? (
                  <div className="lesson-submodules">
                    {moduleGroup.lessons.map((lesson, index) => {
                      const knownWords = getModuleMasteredCount(lesson, progress);
                      const totalWords = lesson.words.length;
                      const completionPercent = Math.round((knownWords / totalWords) * 100);
                      const isCompleted = isModuleCompleted(lesson, progress);
                      const progressLabel = isCompleted
                        ? "Terminé"
                        : `${knownWords} / ${totalWords} mots • ${completionPercent}%`;

                      return (
                        <ModuleCard
                          key={lesson.id}
                          isCompleted={isCompleted}
                          module={lesson}
                          onOpen={() => onOpenLesson(lesson.id)}
                          progressLabel={`Leçon ${index + 1} • ${progressLabel}`}
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
              : "Encore quelques mots et tu débloques la révision."}
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

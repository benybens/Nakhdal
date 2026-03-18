import { useMemo, useState } from "react";
import { ModuleCard } from "../components/ModuleCard";
import { getModuleMasteredCount, isModuleCompleted } from "../logic/trainingEngine";
import { getModuleProgress } from "../store/progressStore";
import { UserProgress, VocabularyModule } from "../types";

type HomeProps = {
  modules: VocabularyModule[];
  progress: UserProgress;
  canStartTraining: boolean;
  onOpenModule: (moduleId: string) => void;
  onOpenTraining: () => void;
};

type LessonGroup = {
  id: string;
  title: string;
  modules: VocabularyModule[];
};

const getLessonTitle = (moduleTitle: string) => moduleTitle.replace(/ - Part \d+$/, "");
const getLessonId = (moduleId: string) => moduleId.replace(/_part_\d+$/, "");

export const Home = ({
  modules,
  progress,
  canStartTraining,
  onOpenModule,
  onOpenTraining,
}: HomeProps) => {
  const lessonGroups = useMemo<LessonGroup[]>(() => {
    const groups = new Map<string, LessonGroup>();

    for (const module of modules) {
      const lessonId = getLessonId(module.id);
      const existingGroup = groups.get(lessonId);

      if (existingGroup) {
        existingGroup.modules.push(module);
        continue;
      }

      groups.set(lessonId, {
        id: lessonId,
        title: getLessonTitle(module.title),
        modules: [module],
      });
    }

    return Array.from(groups.values());
  }, [modules]);

  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((current) => ({
      ...current,
      [lessonId]: !current[lessonId],
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
          <span className="section-note">Choisis un thème et laisse les mots venir tranquilles.</span>
        </div>

        <div className="lesson-list">
          {lessonGroups.map((lesson) => {
            const isExpanded = expandedLessons[lesson.id] ?? false;
            const completedModules = lesson.modules.filter((module) =>
              isModuleCompleted(module, progress),
            ).length;
            const exploredModules = lesson.modules.filter((module) => {
              const moduleProgress = getModuleProgress(progress, module);
              return Object.keys(moduleProgress.wordStats).length > 0;
            }).length;

            let lessonProgress = "Pas encore exploré";
            if (completedModules === lesson.modules.length) {
              lessonProgress = "Tous les modules sont terminés";
            } else if (exploredModules > 0) {
              lessonProgress = `Tu as déjà ouvert ${exploredModules} module${exploredModules > 1 ? "s" : ""} sur ${lesson.modules.length}`;
            }

            return (
              <section className="lesson-group" key={lesson.id}>
                <button
                  aria-expanded={isExpanded}
                  className="lesson-toggle"
                  onClick={() => toggleLesson(lesson.id)}
                  type="button"
                >
                  <span>
                    <span className="lesson-toggle__title">{lesson.title}</span>
                    <span className="lesson-toggle__meta">{lessonProgress}</span>
                  </span>
                  <span className={`lesson-toggle__chevron ${isExpanded ? "lesson-toggle__chevron--open" : ""}`}>
                    v
                  </span>
                </button>

                {isExpanded ? (
                  <div className="lesson-submodules">
                    {lesson.modules.map((module) => {
                      const knownWords = getModuleMasteredCount(module, progress);
                      const totalWords = module.words.length;
                      const completionPercent = Math.round((knownWords / totalWords) * 100);
                      const isCompleted = isModuleCompleted(module, progress);
                      const progressLabel = isCompleted
                        ? "Terminé"
                        : `${knownWords} / ${totalWords} mots • ${completionPercent}%`;

                      return (
                        <ModuleCard
                          key={module.id}
                          isCompleted={isCompleted}
                          module={module}
                          onOpen={() => onOpenModule(module.id)}
                          progressLabel={progressLabel}
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

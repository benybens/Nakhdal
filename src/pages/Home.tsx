import { useMemo, useState } from "react";
import { ModuleCard } from "../components/ModuleCard";
import { getModuleMasteredCount, isModuleCompleted } from "../logic/trainingEngine";
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
        <h1>Algerian to French word trainer</h1>
        <p className="hero-copy">
          Learn module by module, master each word twice, then keep reviewing in an
          endless training session.
        </p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Lessons</h2>
          <span className="section-note">Open a lesson to reveal its word-focused sub-modules.</span>
        </div>

        <div className="lesson-list">
          {lessonGroups.map((lesson) => {
            const isExpanded = expandedLessons[lesson.id] ?? false;
            const completedModules = lesson.modules.filter((module) =>
              isModuleCompleted(module, progress),
            ).length;
            const lessonProgress = `${completedModules} / ${lesson.modules.length} sub-modules mastered`;

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
                      const masteredCount = getModuleMasteredCount(module, progress);
                      const completed = isModuleCompleted(module, progress);
                      const progressLabel = completed
                        ? "100% mastered"
                        : `${masteredCount} / ${module.words.length} mastered`;

                      return (
                        <ModuleCard
                          key={module.id}
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
          <h2>Training Session</h2>
          <span className="section-note">Available after at least one module is completed.</span>
        </div>
        <button
          className="primary-button"
          disabled={!canStartTraining}
          onClick={onOpenTraining}
          type="button"
        >
          Start Training Session
        </button>
      </section>
    </div>
  );
};



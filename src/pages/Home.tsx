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

export const Home = ({
  modules,
  progress,
  canStartTraining,
  onOpenModule,
  onOpenTraining,
}: HomeProps) => {
  return (
    <div className="page-shell">
      <header className="hero">
        <p className="page-kicker">Nakhdal</p>
        <h1>Algerian to French vocabulary trainer</h1>
        <p className="hero-copy">
          Learn module by module, master each word twice, then keep reviewing in an
          endless training session.
        </p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Modules</h2>
          <span className="section-note">Each sub-module contains at most 5 new inputs.</span>
        </div>

        <div className="module-grid">
          {modules.map((module) => {
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

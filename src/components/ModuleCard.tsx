import { VocabularyModule } from "../types";

type ModuleCardProps = {
  module: VocabularyModule;
  progressLabel: string;
  onOpen: () => void;
};

export const ModuleCard = ({ module, progressLabel, onOpen }: ModuleCardProps) => {
  return (
    <button className="module-card" onClick={onOpen} type="button">
      <span className="module-card__title">{module.title}</span>
      <span className="module-card__progress">{progressLabel}</span>
    </button>
  );
};

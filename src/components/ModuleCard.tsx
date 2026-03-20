import { VocabularyLesson } from "../types";

type ModuleCardProps = {
  module: VocabularyLesson;
  progressLabel: string;
  isCompleted?: boolean;
  onOpen: () => void;
};

export const ModuleCard = ({ module, progressLabel, isCompleted = false, onOpen }: ModuleCardProps) => {
  return (
    <button className={`module-card ${isCompleted ? "module-card--completed" : ""}`.trim()} onClick={onOpen} type="button">
      <span className="module-card__title">{module.title}</span>
      <span className="module-card__progress">{progressLabel}</span>
    </button>
  );
};

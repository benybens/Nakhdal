import { TrainingSession } from "../components/TrainingSession";
import type { ProgressStoreState } from "../store/progressStore";

type TrainingPageProps = {
  progress: ProgressStoreState;
  onBack: () => void;
  onProgressChange: (nextProgress: ProgressStoreState) => void;
  title?: string;
  kicker?: string;
};

export const TrainingPage = ({ progress, onBack, onProgressChange, title, kicker }: TrainingPageProps) => {
  return (
    <TrainingSession
      kicker={kicker}
      onExit={onBack}
      onProgressChange={onProgressChange}
      progress={progress}
      title={title}
    />
  );
};

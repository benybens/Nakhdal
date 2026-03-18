import { TrainingSession } from "../components/TrainingSession";
import { VocabularyWord } from "../types";

type TrainingPageProps = {
  words: VocabularyWord[];
  onBack: () => void;
  title?: string;
  kicker?: string;
};

export const TrainingPage = ({ words, onBack, title, kicker }: TrainingPageProps) => {
  return (
    <TrainingSession
      kicker={kicker}
      onExit={onBack}
      title={title}
      words={words}
    />
  );
};
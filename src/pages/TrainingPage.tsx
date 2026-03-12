import { TrainingSession } from "../components/TrainingSession";
import { VocabularyWord } from "../types";

type TrainingPageProps = {
  words: VocabularyWord[];
  onBack: () => void;
};

export const TrainingPage = ({ words, onBack }: TrainingPageProps) => {
  return <TrainingSession onExit={onBack} words={words} />;
};

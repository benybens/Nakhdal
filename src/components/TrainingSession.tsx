import { useMemo, useState } from "react";
import { WordTrainer } from "./WordTrainer";
import { submitAnswer } from "../logic/trainingEngine";
import { VocabularyWord } from "../types";

type TrainingSessionProps = {
  words: VocabularyWord[];
  onExit: () => void;
};

const getRandomWord = (words: VocabularyWord[]) => {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
};

export const TrainingSession = ({ words, onExit }: TrainingSessionProps) => {
  const [currentWord, setCurrentWord] = useState(() => getRandomWord(words));
  const [pendingNextWord, setPendingNextWord] = useState<VocabularyWord | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect";
    message: string;
  } | null>(null);
  const [answersCount, setAnswersCount] = useState(0);

  const helperText = useMemo(() => {
    return "Infinite training session with words from completed modules.";
  }, []);

  const handleSubmit = (answer: string) => {
    const result = submitAnswer(currentWord, answer, {
      exposed: true,
      successCount: 0,
      mastered: false,
    });

    setAnswersCount((value) => value + 1);
    setFeedback(
      result.isCorrect
        ? { type: "correct", message: "Correct" }
        : {
            type: "incorrect",
            message: `Incorrect. Correct answer: ${result.correctAnswer}`,
          },
    );
    setPendingNextWord(getRandomWord(words));
  };

  const handleContinue = () => {
    if (pendingNextWord) {
      setCurrentWord(pendingNextWord);
    }

    setPendingNextWord(null);
    setFeedback(null);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Training Session</p>
          <h1>Revision Loop</h1>
        </div>
        <button className="secondary-button" onClick={onExit} type="button">
          Exit
        </button>
      </header>

      <WordTrainer
        feedback={feedback}
        helperText={helperText}
        isAnswered={pendingNextWord !== null}
        mode="question"
        onContinue={handleContinue}
        onNextExposure={() => undefined}
        onSubmit={handleSubmit}
        progressLabel={`Answers given: ${answersCount}`}
        word={currentWord}
      />
    </div>
  );
};

import { useEffect, useMemo, useState } from "react";
import { WordTrainer } from "./WordTrainer";
import { getQuestionOptions, getRandomRevisionWord, submitAnswer } from "../logic/trainingEngine";
import { playAnswerFeedbackSound } from "../logic/feedbackSound";
import { VocabularyWord } from "../types";

type TrainingSessionProps = {
  words: VocabularyWord[];
  onExit: () => void;
  title?: string;
  kicker?: string;
};

const AUTO_ADVANCE_MS = 5000;
const CORRECT_ADVANCE_MS = 1000;
const COUNTDOWN_TICK_MS = 50;

export const TrainingSession = ({
  words,
  onExit,
  title = "Boucle de révision",
  kicker = "Session de révision",
}: TrainingSessionProps) => {
  const [currentWord, setCurrentWord] = useState(() => getRandomRevisionWord({ modules: {}, revisionWords: words }) ?? words[0]);
  const [pendingNextWord, setPendingNextWord] = useState<VocabularyWord | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect";
    message: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answersCount, setAnswersCount] = useState(0);
  const [countdownProgress, setCountdownProgress] = useState(0);

  const questionOptions = useMemo(() => getQuestionOptions(currentWord, words), [currentWord, words]);

  useEffect(() => {
    if (!pendingNextWord) {
      setCountdownProgress(0);
      return;
    }

    const advanceDelay = feedback?.type === "correct" ? CORRECT_ADVANCE_MS : AUTO_ADVANCE_MS;
    const startedAt = Date.now();
    setCountdownProgress(1);

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingRatio = Math.max(0, 1 - elapsed / advanceDelay);
      setCountdownProgress(remainingRatio);
    }, COUNTDOWN_TICK_MS);

    const timerId = window.setTimeout(() => {
      setCurrentWord(pendingNextWord);
      setPendingNextWord(null);
      setFeedback(null);
      setSelectedAnswer(null);
      setCountdownProgress(0);
    }, advanceDelay);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(timerId);
    };
  }, [feedback?.type, pendingNextWord]);

  const handleSubmit = (answer: string) => {
    setSelectedAnswer(answer);
    const result = submitAnswer(currentWord, answer, {
      exposed: true,
      successCount: 0,
      mastered: false,
    });

    playAnswerFeedbackSound(result.isCorrect);
    setAnswersCount((value) => value + 1);
    const nextWord = getRandomRevisionWord({ modules: {}, revisionWords: words }, currentWord) ?? currentWord;

    if (result.isCorrect) {
      setFeedback({ type: "correct", message: "" });
      setPendingNextWord(nextWord);
      setCountdownProgress(1);
      return;
    }

    setFeedback({
      type: "incorrect",
      message: "",
    });
    setPendingNextWord(nextWord);
    setCountdownProgress(1);
  };

  const handleContinue = () => {
    if (pendingNextWord) {
      setCurrentWord(pendingNextWord);
    }

    setPendingNextWord(null);
    setFeedback(null);
    setSelectedAnswer(null);
    setCountdownProgress(0);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">{kicker}</p>
          <h1>{title}</h1>
        </div>
        <button className="secondary-button" onClick={onExit} type="button">
          Quitter
        </button>
      </header>

      <WordTrainer
        countdownProgress={countdownProgress}
        feedback={feedback}
        helperText="Choisis la bonne traduction parmi quatre cartes."
        isAnswered={pendingNextWord !== null}
        mode="question"
        onContinue={handleContinue}
        onNextExposure={() => undefined}
        onSubmit={handleSubmit}
        options={questionOptions}
        progressLabel={`Réponses données : ${answersCount}`}
        selectedAnswer={selectedAnswer}
        showAnsweredControls={feedback?.type !== "correct"}
        word={currentWord}
      />
    </div>
  );
};

import { useEffect, useMemo, useState } from "react";
import { WordTrainer } from "../components/WordTrainer";
import {
  getModuleMasteredCount,
  getNextWord,
  isModuleCompleted,
  markExposureComplete,
  submitAnswer,
} from "../logic/trainingEngine";
import {
  getModuleProgress,
  getWordProgress,
  markModuleCompleted,
  updateWordProgress,
} from "../store/progressStore";
import { UserProgress, VocabularyModule } from "../types";

type ModulePageProps = {
  module: VocabularyModule;
  progress: UserProgress;
  onBack: () => void;
  onProgressChange: (nextProgress: UserProgress) => void;
};

export const ModulePage = ({
  module,
  progress,
  onBack,
  onProgressChange,
}: ModulePageProps) => {
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect";
    message: string;
  } | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);

  const currentWordState = useMemo(() => getNextWord(module, progress), [module, progress]);
  const masteredCount = getModuleMasteredCount(module, progress);
  const completed = isModuleCompleted(module, progress);
  const moduleProgress = getModuleProgress(progress, module);

  useEffect(() => {
    if (completed && !moduleProgress.completed) {
      const nextProgress = markModuleCompleted(progress, module);
      onProgressChange(nextProgress);
    }
  }, [completed, module, moduleProgress.completed, onProgressChange, progress]);

  if (completed || !currentWordState) {
    return (
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="page-kicker">Module Complete</p>
            <h1>{module.title}</h1>
          </div>
          <button className="secondary-button" onClick={onBack} type="button">
            Back Home
          </button>
        </header>

        <section className="trainer-card">
          <h2>All words mastered</h2>
          <p className="helper-text">
            This module is now at 100% and its words were added to the revision pool.
          </p>
        </section>
      </div>
    );
  }

  const progressLabel = `Word ${masteredCount + 1} / ${module.words.length}`;
  const helperText =
    currentWordState.attemptType === "exposure"
      ? "First exposure: read the translation, then continue."
      : "Translate the Algerian word into French.";

  const handleExposureNext = () => {
    const currentProgress = getWordProgress(progress, module.id, currentWordState.word);
    const nextProgress = updateWordProgress(
      progress,
      module.id,
      currentWordState.word,
      markExposureComplete(currentProgress),
    );

    setFeedback(null);
    onProgressChange(nextProgress);
  };

  const handleSubmit = (answer: string) => {
    const result = submitAnswer(
      currentWordState.word,
      answer,
      getWordProgress(progress, module.id, currentWordState.word),
    );
    const nextProgress = updateWordProgress(
      progress,
      module.id,
      currentWordState.word,
      result.updatedProgress,
    );

    setFeedback(
      result.isCorrect
        ? { type: "correct", message: "Correct" }
        : {
            type: "incorrect",
            message: `Incorrect. Correct answer: ${result.correctAnswer}`,
          },
    );
    setPendingAdvance(true);
    onProgressChange(nextProgress);
  };

  const handleContinue = () => {
    setFeedback(null);
    setPendingAdvance(false);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Module Training</p>
          <h1>{module.title}</h1>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">
          Back Home
        </button>
      </header>

      <WordTrainer
        feedback={feedback}
        helperText={helperText}
        isAnswered={pendingAdvance}
        mode={currentWordState.attemptType}
        onContinue={handleContinue}
        onNextExposure={handleExposureNext}
        onSubmit={handleSubmit}
        progressLabel={progressLabel}
        word={currentWordState.word}
      />
    </div>
  );
};

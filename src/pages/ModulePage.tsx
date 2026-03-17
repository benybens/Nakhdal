import { useEffect, useMemo, useState } from "react";
import { WordTrainer } from "../components/WordTrainer";
import {
  getModuleMasteredCount,
  getNextWord,
  getQuestionOptions,
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
import { TrainerWordState, UserProgress, VocabularyModule } from "../types";

type ModulePageProps = {
  module: VocabularyModule;
  progress: UserProgress;
  onBack: () => void;
  onProgressChange: (nextProgress: UserProgress) => void;
};

const AUTO_ADVANCE_MS = 5000;
const COUNTDOWN_TICK_MS = 50;

const ModulePage = ({
  module,
  progress,
  onBack,
  onProgressChange,
}: ModulePageProps) => {
  const [sessionProgress, setSessionProgress] = useState<UserProgress>(progress);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect";
    message: string;
  } | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [pendingProgress, setPendingProgress] = useState<UserProgress | null>(null);
  const [countdownProgress, setCountdownProgress] = useState(0);
  const [currentWordState, setCurrentWordState] = useState<TrainerWordState | null>(() =>
    getNextWord(module, progress),
  );

  useEffect(() => {
    setSessionProgress(progress);
    setFeedback(null);
    setPendingAdvance(false);
    setPendingProgress(null);
    setCountdownProgress(0);
    setCurrentWordState(getNextWord(module, progress));
  }, [module.id, progress]);

  const questionOptions = useMemo(() => {
    if (!currentWordState || currentWordState.attemptType !== "question") {
      return [];
    }

    return getQuestionOptions(currentWordState.word, module.words);
  }, [currentWordState, module.words]);

  const completed = isModuleCompleted(module, sessionProgress);
  const moduleProgress = getModuleProgress(sessionProgress, module);

  useEffect(() => {
    if (!pendingAdvance || !pendingProgress) {
      setCountdownProgress(0);
      return;
    }

    const startedAt = Date.now();
    setCountdownProgress(1);

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingRatio = Math.max(0, 1 - elapsed / AUTO_ADVANCE_MS);
      setCountdownProgress(remainingRatio);
    }, COUNTDOWN_TICK_MS);

    const timerId = window.setTimeout(() => {
      const nextWord = getNextWord(module, pendingProgress);
      setFeedback(null);
      setPendingAdvance(false);
      setSessionProgress(pendingProgress);
      setCurrentWordState(nextWord);
      onProgressChange(pendingProgress);
      setPendingProgress(null);
      setCountdownProgress(0);
    }, AUTO_ADVANCE_MS);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(timerId);
    };
  }, [module, onProgressChange, pendingAdvance, pendingProgress]);

  useEffect(() => {
    if (completed && !moduleProgress.completed) {
      const nextProgress = markModuleCompleted(sessionProgress, module);
      setSessionProgress(nextProgress);
      onProgressChange(nextProgress);
    }
  }, [completed, module, moduleProgress.completed, onProgressChange, sessionProgress]);

  const progressLabel = useMemo(() => {
    const currentProgress = pendingProgress ?? sessionProgress;
    const currentMasteredCount = getModuleMasteredCount(module, currentProgress);
    return `Mot ${Math.min(currentMasteredCount + 1, module.words.length)} / ${module.words.length}`;
  }, [module, pendingProgress, sessionProgress]);

  if (completed || !currentWordState) {
    return (
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="page-kicker">Déjà vu</p>
            <h1>{module.title}</h1>
          </div>
          <button className="secondary-button" onClick={onBack} type="button">
            Retour à l'accueil
          </button>
        </header>

        <section className="trainer-card">
          <h2>Tu connais ça</h2>
          <p className="helper-text">
            Bien joué. Tu viens d'ajouter un nouveau bout d'algérien à ton oreille.
          </p>
        </section>
      </div>
    );
  }

  const helperText =
    currentWordState.attemptType === "exposure"
      ? "Tu regardes, tu captes, tu continues."
      : "Choisis la bonne traduction parmi quatre cartes.";

  const handleExposureNext = () => {
    const currentProgress = getWordProgress(sessionProgress, module.id, currentWordState.word);
    const nextProgress = updateWordProgress(
      sessionProgress,
      module.id,
      currentWordState.word,
      markExposureComplete(currentProgress),
    );

    setFeedback(null);
    setPendingAdvance(false);
    setPendingProgress(null);
    setCountdownProgress(0);
    setSessionProgress(nextProgress);
    setCurrentWordState(getNextWord(module, nextProgress));
    onProgressChange(nextProgress);
  };

  const handleSubmit = (answer: string) => {
    const result = submitAnswer(
      currentWordState.word,
      answer,
      getWordProgress(sessionProgress, module.id, currentWordState.word),
    );
    const nextProgress = updateWordProgress(
      sessionProgress,
      module.id,
      currentWordState.word,
      result.updatedProgress,
    );

    setFeedback(
      result.isCorrect
        ? { type: "correct", message: "Oui, c'est ça" }
        : {
            type: "incorrect",
            message: `Pas cette fois. La bonne réponse, c'était : ${result.correctAnswer}`,
          },
    );
    setPendingAdvance(true);
    setPendingProgress(nextProgress);
    setCountdownProgress(1);
  };

  const handleContinue = () => {
    if (!pendingProgress) {
      return;
    }

    const nextWord = getNextWord(module, pendingProgress);
    setFeedback(null);
    setPendingAdvance(false);
    setSessionProgress(pendingProgress);
    setCurrentWordState(nextWord);
    onProgressChange(pendingProgress);
    setPendingProgress(null);
    setCountdownProgress(0);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">En route</p>
          <h1>{module.title}</h1>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">
          Retour à l'accueil
        </button>
      </header>

      <WordTrainer
        key={`${currentWordState.word.dz}-${currentWordState.attemptType}-${pendingAdvance ? "locked" : "open"}`}
        countdownProgress={countdownProgress}
        feedback={feedback}
        helperText={helperText}
        isAnswered={pendingAdvance}
        mode={currentWordState.attemptType}
        onContinue={handleContinue}
        onNextExposure={handleExposureNext}
        onSubmit={handleSubmit}
        options={questionOptions}
        progressLabel={progressLabel}
        word={currentWordState.word}
      />
    </div>
  );
};

export { ModulePage };
export default ModulePage;

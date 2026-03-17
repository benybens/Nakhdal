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
import { TrainerWordState, UserProgress, VocabularyModule } from "../types";

type ModulePageProps = {
  module: VocabularyModule;
  progress: UserProgress;
  onBack: () => void;
  onProgressChange: (nextProgress: UserProgress) => void;
};

const AUTO_ADVANCE_MS = 900;

export const ModulePage = ({
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
  const [currentWordState, setCurrentWordState] = useState<TrainerWordState | null>(() =>
    getNextWord(module, progress),
  );
  const [debugEvents, setDebugEvents] = useState<string[]>([]);

  const appendDebug = (message: string) => {
    setDebugEvents((current) => [`${new Date().toLocaleTimeString()} ${message}`, ...current].slice(0, 12));
  };

  useEffect(() => {
    setSessionProgress(progress);
    setFeedback(null);
    setPendingAdvance(false);
    setPendingProgress(null);
    setCurrentWordState(getNextWord(module, progress));
    setDebugEvents([]);
  }, [module.id]);

  const masteredCount = getModuleMasteredCount(module, sessionProgress);
  const completed = isModuleCompleted(module, sessionProgress);
  const moduleProgress = getModuleProgress(sessionProgress, module);

  useEffect(() => {
    appendDebug(
      `render word=${currentWordState?.word.dz ?? "none"} mode=${currentWordState?.attemptType ?? "none"} pending=${String(pendingAdvance)} feedback=${feedback?.type ?? "none"}`,
    );
  }, [currentWordState, feedback, pendingAdvance]);

  useEffect(() => {
    if (!pendingAdvance || !pendingProgress) {
      return;
    }

    const timerId = window.setTimeout(() => {
      const nextWord = getNextWord(module, pendingProgress);
      setFeedback(null);
      setPendingAdvance(false);
      setSessionProgress(pendingProgress);
      setCurrentWordState(nextWord);
      onProgressChange(pendingProgress);
      setPendingProgress(null);
      appendDebug(
        `auto-advance next-word=${nextWord?.word.dz ?? "none"} next-mode=${nextWord?.attemptType ?? "none"}`,
      );
    }, AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timerId);
  }, [module, onProgressChange, pendingAdvance, pendingProgress]);

  useEffect(() => {
    if (completed && !moduleProgress.completed) {
      const nextProgress = markModuleCompleted(sessionProgress, module);
      setSessionProgress(nextProgress);
      onProgressChange(nextProgress);
      appendDebug("module completed and committed");
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
            <p className="page-kicker">Module termine</p>
            <h1>{module.title}</h1>
          </div>
          <button className="secondary-button" onClick={onBack} type="button">
            Retour a l'accueil
          </button>
        </header>

        <section className="trainer-card">
          <h2>Tous les mots sont maitrises</h2>
          <p className="helper-text">
            Ce module est maintenant a 100 % et ses mots ont ete ajoutes a la revision.
          </p>
        </section>
      </div>
    );
  }

  const helperText =
    currentWordState.attemptType === "exposure"
      ? "Premiere exposition : lis la traduction, puis continue."
      : "Traduis le mot ou le verbe algerien en francais.";

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
    setSessionProgress(nextProgress);
    setCurrentWordState(getNextWord(module, nextProgress));
    onProgressChange(nextProgress);
    appendDebug(`exposure-next word=${currentWordState.word.dz}`);
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
        ? { type: "correct", message: "Correct" }
        : {
            type: "incorrect",
            message: `Incorrect. Bonne reponse : ${result.correctAnswer}`,
          },
    );
    setPendingAdvance(true);
    setPendingProgress(nextProgress);
    appendDebug(`submit word=${currentWordState.word.dz} correct=${String(result.isCorrect)}`);
  };

  const handleContinue = () => {
    if (!pendingProgress) {
      appendDebug("manual-next ignored no pending progress");
      return;
    }

    const nextWord = getNextWord(module, pendingProgress);
    setFeedback(null);
    setPendingAdvance(false);
    setSessionProgress(pendingProgress);
    setCurrentWordState(nextWord);
    onProgressChange(pendingProgress);
    setPendingProgress(null);
    appendDebug(
      `manual-next next-word=${nextWord?.word.dz ?? "none"} next-mode=${nextWord?.attemptType ?? "none"}`,
    );
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Entrainement du module</p>
          <h1>{module.title}</h1>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">
          Retour a l'accueil
        </button>
      </header>

      <div className="training-layout">
        <WordTrainer
          key={`${currentWordState.word.dz}-${currentWordState.attemptType}-${pendingAdvance ? "locked" : "open"}`}
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

        <aside className="debug-card">
          <p className="eyebrow">Debug</p>
          <p><strong>Mot :</strong> {currentWordState.word.dz}</p>
          <p><strong>Mode :</strong> {currentWordState.attemptType}</p>
          <p><strong>Saisie desactivee :</strong> {pendingAdvance ? "oui" : "non"}</p>
          <p><strong>Retour :</strong> {feedback?.type ?? "aucun"}</p>
          <p><strong>Progression en attente :</strong> {pendingProgress ? "oui" : "non"}</p>
          <p><strong>Maitrises :</strong> {masteredCount} / {module.words.length}</p>
          <div className="debug-log">
            {debugEvents.map((event) => (
              <p key={event}>{event}</p>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

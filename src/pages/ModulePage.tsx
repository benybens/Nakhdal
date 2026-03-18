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
import { playAnswerFeedbackSound } from "../logic/feedbackSound";
import { TrainerWordState, UserProgress, VocabularyModule, VocabularyWord } from "../types";

type ModulePageProps = {
  module: VocabularyModule;
  nextModule?: VocabularyModule | null;
  progress: UserProgress;
  onBack: () => void;
  onGoToModuleTraining?: () => void;
  onGoToNextModule?: () => void;
  onProgressChange: (nextProgress: UserProgress) => void;
};

const AUTO_ADVANCE_MS = 5000;
const COUNTDOWN_TICK_MS = 50;

const FEMININE_DZ_FORMS = new Set([
  "Ntia",
  "Hiya",
  "Hadi",
  "Hadik",
  "Ta3ha",
  "Sa7bati",
  "S7abati",
  "Chaba",
  "Mli7a",
  "3a9la",
  "3ayana",
  "Sahla",
  "Wa3ra",
  "S3iba",
]);

const MASCULINE_DZ_FORMS = new Set([
  "Nta",
  "Houwa",
  "Hada",
  "Hadak",
  "Ta3ou",
  "Sa7bi",
  "S7abi",
  "Chbab",
  "Mli7",
  "3a9al",
  "3ayan",
  "Sahal",
  "Wa3ar",
  "S3ib",
]);

const getGenderSuffix = (word: VocabularyWord) => {
  if (FEMININE_DZ_FORMS.has(word.dz)) {
    return "(f)";
  }

  if (MASCULINE_DZ_FORMS.has(word.dz)) {
    return "(m)";
  }

  return "";
};

const formatFrenchLabel = (word: VocabularyWord, moduleWords: VocabularyWord[]) => {
  const sameFrenchWords = moduleWords.filter((candidate) => candidate.fr === word.fr);

  if (sameFrenchWords.length < 2) {
    return word.fr;
  }

  const genderSuffix = getGenderSuffix(word);
  return genderSuffix ? `${word.fr} ${genderSuffix}` : word.fr;
};

const ModulePage = ({
  module,
  nextModule,
  progress,
  onBack,
  onGoToModuleTraining,
  onGoToNextModule,
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
  const [isExposureAdvancing, setIsExposureAdvancing] = useState(false);
  const [currentWordState, setCurrentWordState] = useState<TrainerWordState | null>(() =>
    getNextWord(module, progress),
  );

  useEffect(() => {
    setSessionProgress(progress);
    setFeedback(null);
    setPendingAdvance(false);
    setPendingProgress(null);
    setCountdownProgress(0);
    setIsExposureAdvancing(false);
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
    const wordStates = module.words.map((word) => {
      const wordProgress = getWordProgress(sessionProgress, module.id, word);
      return {
        dz: word.dz,
        fr: word.fr,
        exposed: wordProgress.exposed,
        mastered: wordProgress.mastered,
        successCount: wordProgress.successCount,
      };
    });

    console.log("[Nahdar][ModulePage] Module state", {
      moduleId: module.id,
      moduleTitle: module.title,
      wordCount: module.words.length,
      completed,
      moduleProgress,
      currentWordState,
      wordStates,
    });
  }, [completed, currentWordState, module, moduleProgress, sessionProgress]);

  useEffect(() => {
    if (completed && !moduleProgress.completed) {
      const nextProgress = markModuleCompleted(sessionProgress, module);
      setSessionProgress(nextProgress);
      onProgressChange(nextProgress);
    }
  }, [completed, module, moduleProgress.completed, onProgressChange, sessionProgress]);

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

  const progressLabel = useMemo(() => {
    const currentProgress = pendingProgress ?? sessionProgress;
    const currentMasteredCount = getModuleMasteredCount(module, currentProgress);
    return `Mot ${Math.min(currentMasteredCount + 1, module.words.length)} sur ${module.words.length}`;
  }, [module, pendingProgress, sessionProgress]);

  const translationLabel = currentWordState
    ? formatFrenchLabel(currentWordState.word, module.words)
    : undefined;

  const getOptionLabel = (option: string) => {
    if (!currentWordState || option !== currentWordState.word.fr) {
      return option;
    }

    return formatFrenchLabel(currentWordState.word, module.words);
  };

  if (completed || !currentWordState) {
    return (
      <div className="page-shell">
        <header className="page-header">
          <div>
            <h1>{module.title}</h1>
          </div>
        </header>

        <section className="trainer-card trainer-card--complete">
          <div className="completion-actions">
            {onGoToModuleTraining ? (
              <button className="primary-button" onClick={onGoToModuleTraining} type="button">
                Rejouer ce module
              </button>
            ) : null}
            {nextModule && onGoToNextModule ? (
              <button className="secondary-button" onClick={onGoToNextModule} type="button">
                Passer à la suite
              </button>
            ) : null}
            <button className="secondary-button" onClick={onBack} type="button">
              Retour à l'accueil
            </button>
          </div>
        </section>
      </div>
    );
  }

  const helperText =
    currentWordState.attemptType === "exposure"
      ? undefined
      : "Choisis la bonne traduction parmi quatre cartes.";

  const handleExposureNext = () => {
    if (isExposureAdvancing) {
      return;
    }

    const currentProgress = getWordProgress(sessionProgress, module.id, currentWordState.word);
    const nextProgress = updateWordProgress(
      sessionProgress,
      module.id,
      currentWordState.word,
      markExposureComplete(currentProgress),
    );

    setIsExposureAdvancing(true);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setFeedback(null);
        setPendingAdvance(false);
        setPendingProgress(null);
        setCountdownProgress(0);
        setSessionProgress(nextProgress);
        setCurrentWordState(getNextWord(module, nextProgress));
        setIsExposureAdvancing(false);
        onProgressChange(nextProgress);
      });
    });
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

    playAnswerFeedbackSound(result.isCorrect);
    setFeedback(
      result.isCorrect
        ? { type: "correct", message: "Oui, c'est ça" }
        : {
            type: "incorrect",
            message: `Pas cette fois. La bonne réponse, c'était : ${translationLabel ?? result.correctAnswer}`,
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
        countdownProgress={countdownProgress}
        feedback={feedback}
        getOptionLabel={getOptionLabel}
        helperText={helperText}
        isAnswered={pendingAdvance || isExposureAdvancing}
        mode={currentWordState.attemptType}
        onContinue={handleContinue}
        onNextExposure={handleExposureNext}
        onSubmit={handleSubmit}
        options={questionOptions}
        progressLabel={progressLabel}
        translationLabel={translationLabel}
        word={currentWordState.word}
      />
    </div>
  );
};

export { ModulePage };
export default ModulePage;

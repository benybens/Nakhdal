import { useEffect, useMemo, useState } from "react";
import { WordTrainer } from "../components/WordTrainer";
import { playAnswerFeedbackSound } from "../logic/feedbackSound";
import { advanceSession, createSessionState, evaluateAnswer, getCurrentSessionItem } from "../logic/sessionEngine";
import { getWordsByScope, type ProgressStoreState } from "../store/progressStore";
import type { VocabularyWord } from "../types";
import type { LearningSessionState } from "../logic/sessionEngine";
import type { SubModule } from "../types/learning";

type ModulePageProps = {
  subModule: SubModule;
  nextSubModule?: SubModule | null;
  progress: ProgressStoreState;
  onBack: () => void;
  onGoToModuleTraining?: () => void;
  onGoToNextModule?: () => void;
  onProgressChange: (nextProgress: ProgressStoreState) => void;
};

const AUTO_ADVANCE_MS = 5000;
const CORRECT_ADVANCE_MS = 1000;
const COUNTDOWN_TICK_MS = 50;
const SUBMODULE_SESSION_SIZE = 10;

const FEMININE_DZ_FORMS = new Set(["Ntia", "Hiya", "Hadi", "Hadik", "Ta3ha", "Sa7bati", "S7abati", "Chaba", "Mli7a", "3a9la", "3ayana", "Sahla", "Wa3ra", "S3iba"]);
const MASCULINE_DZ_FORMS = new Set(["Nta", "Houwa", "Hada", "Hadak", "Ta3ou", "Sa7bi", "S7abi", "Chbab", "Mli7", "3a9al", "3ayan", "Sahal", "Wa3ar", "S3ib"]);

const getGenderSuffix = (word: VocabularyWord) => {
  if (FEMININE_DZ_FORMS.has(word.dz)) return "(f)";
  if (MASCULINE_DZ_FORMS.has(word.dz)) return "(m)";
  return "";
};

const formatFrenchLabel = (word: VocabularyWord, moduleWords: VocabularyWord[]) => {
  const sameFrenchWords = moduleWords.filter((candidate) => candidate.fr === word.fr);
  if (sameFrenchWords.length < 2) return word.fr;
  const genderSuffix = getGenderSuffix(word);
  return genderSuffix ? `${word.fr} ${genderSuffix}` : word.fr;
};

const ModulePage = ({
  subModule,
  nextSubModule,
  progress,
  onBack,
  onGoToModuleTraining,
  onGoToNextModule,
  onProgressChange,
}: ModulePageProps) => {
  const [sessionProgress, setSessionProgress] = useState<ProgressStoreState>(progress);
  const [sessionState, setSessionState] = useState<LearningSessionState | null>(null);
  const [feedback, setFeedback] = useState<{ type: "correct" | "incorrect"; message: string } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [pendingProgress, setPendingProgress] = useState<ProgressStoreState | null>(null);
  const [pendingSessionState, setPendingSessionState] = useState<LearningSessionState | null>(null);
  const [countdownProgress, setCountdownProgress] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);

  const moduleWords = useMemo(
    () => getWordsByScope({ type: "submodule", moduleId: subModule.moduleId, subModuleId: subModule.id }).map((word) => ({ dz: word.dz, fr: word.fr })),
    [subModule.id, subModule.moduleId],
  );

  const moduleWordById = useMemo(
    () => new Map(getWordsByScope({ type: "submodule", moduleId: subModule.moduleId, subModuleId: subModule.id }).map((word) => [word.id, { dz: word.dz, fr: word.fr }])),
    [subModule.id, subModule.moduleId],
  );

  useEffect(() => {
    setSessionProgress(progress);
    setSessionState(createSessionState({ type: "submodule", moduleId: subModule.moduleId, subModuleId: subModule.id }, Math.min(SUBMODULE_SESSION_SIZE, moduleWords.length), progress.words));
    setFeedback(null);
    setSelectedAnswer(null);
    setPendingAdvance(false);
    setPendingProgress(null);
    setPendingSessionState(null);
    setCountdownProgress(0);
    setRecallRevealed(false);
  }, [moduleWords.length, progress, subModule.id, subModule.moduleId]);

  const currentSessionItem = sessionState ? getCurrentSessionItem(sessionState) : null;
  const currentWord = currentSessionItem ? moduleWordById.get(currentSessionItem.word_id) ?? null : null;

  useEffect(() => {
    setRecallRevealed(false);
  }, [currentSessionItem?.word_id]);

  useEffect(() => {
    if (!pendingAdvance || !pendingProgress || !pendingSessionState) {
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
      setFeedback(null);
      setPendingAdvance(false);
      setSessionProgress(pendingProgress);
      setSessionState(pendingSessionState);
      onProgressChange(pendingProgress);
      setPendingProgress(null);
      setPendingSessionState(null);
      setSelectedAnswer(null);
      setCountdownProgress(0);
      setRecallRevealed(false);
    }, advanceDelay);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(timerId);
    };
  }, [feedback?.type, onProgressChange, pendingAdvance, pendingProgress, pendingSessionState]);

  const progressLabel = sessionState
    ? `Mot ${Math.min(sessionState.answeredCount + 1, sessionState.totalPlanned)} sur ${sessionState.totalPlanned}`
    : "Aucune session disponible";
  const translationLabel = currentWord ? formatFrenchLabel(currentWord, moduleWords) : undefined;

  const getOptionLabel = (option: string) => {
    if (!currentWord || option !== currentWord.fr) {
      return option;
    }

    return formatFrenchLabel(currentWord, moduleWords);
  };

  const handleAdvance = () => {
    if (!pendingProgress || !pendingSessionState) return;
    setFeedback(null);
    setPendingAdvance(false);
    setSessionProgress(pendingProgress);
    setSessionState(pendingSessionState);
    onProgressChange(pendingProgress);
    setPendingProgress(null);
    setPendingSessionState(null);
    setSelectedAnswer(null);
    setCountdownProgress(0);
    setRecallRevealed(false);
  };

  const handleEvaluation = (submittedAnswer: string | undefined, selfAssessedCorrect?: boolean) => {
    if (!currentSessionItem || !sessionState) return;
    const evaluation = evaluateAnswer(currentSessionItem, { value: submittedAnswer, self_assessed_correct: selfAssessedCorrect });
    const nextResult = advanceSession(sessionState, sessionProgress.words, evaluation);
    const nextProgress = { words: nextResult.progress };
    setSelectedAnswer(submittedAnswer ?? (selfAssessedCorrect ? "__recall_correct__" : "__recall_incorrect__"));
    playAnswerFeedbackSound(evaluation.is_correct);
    setFeedback({ type: evaluation.is_correct ? "correct" : "incorrect", message: "" });
    setPendingAdvance(true);
    setPendingProgress(nextProgress);
    setPendingSessionState(nextResult.session);
    setCountdownProgress(1);
  };

  if (!currentSessionItem || !currentWord) {
    return (
      <div className="page-shell">
        <header className="page-header"><div><h1>{subModule.name}</h1></div></header>
        <section className="trainer-card trainer-card--complete">
          <div className="completion-actions">
            {onGoToModuleTraining ? <button className="primary-button" onClick={onGoToModuleTraining} type="button">Rejouer ce sous-module</button> : null}
            {nextSubModule && onGoToNextModule ? <button className="secondary-button" onClick={onGoToNextModule} type="button">Passer au sous-module suivant</button> : null}
            <button className="secondary-button" onClick={onBack} type="button">Retour a l'accueil</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">En route</p>
          <h1>{subModule.name}</h1>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">Retour a l'accueil</button>
      </header>

      {currentSessionItem.mode === "mcq" ? (
        <WordTrainer
          countdownProgress={countdownProgress}
          feedback={feedback}
          getOptionLabel={getOptionLabel}
          helperText="Choisis la bonne traduction parmi quatre cartes."
          isAnswered={pendingAdvance}
          mode="question"
          onContinue={handleAdvance}
          onNextExposure={() => undefined}
          onSubmit={(answer) => handleEvaluation(answer)}
          options={currentSessionItem.options}
          progressLabel={progressLabel}
          selectedAnswer={selectedAnswer}
          showAnsweredControls={feedback?.type !== "correct"}
          translationLabel={translationLabel}
          word={currentWord}
        />
      ) : (
        <section className="trainer-card">
          <div className="trainer-card__content">
            <p className="eyebrow">{progressLabel}</p>
            <h2 className="trainer-word">{currentWord.dz}</h2>
            {!recallRevealed ? (
              <button className="primary-button" onClick={() => setRecallRevealed(true)} type="button">Afficher la reponse</button>
            ) : (
              <>
                <p className="trainer-translation">{translationLabel ?? currentWord.fr}</p>
                <div className="choice-grid">
                  <button className="choice-card" disabled={pendingAdvance} onClick={() => handleEvaluation(undefined, true)} type="button">Je l'avais</button>
                  <button className="choice-card" disabled={pendingAdvance} onClick={() => handleEvaluation(undefined, false)} type="button">Je me suis trompe</button>
                </div>
              </>
            )}
            {pendingAdvance && feedback?.type !== "correct" ? (
              <div className="countdown-block">
                <div className="countdown-bar" aria-hidden="true"><div className="countdown-bar__fill" style={{ width: `${Math.max(0, Math.min(1, countdownProgress)) * 100}%` }} /></div>
                <button className="primary-button trainer-next-button" onClick={handleAdvance} type="button">Passer tout de suite</button>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
};

export { ModulePage };
export default ModulePage;

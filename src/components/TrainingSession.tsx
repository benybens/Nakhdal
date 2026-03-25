import { useEffect, useState } from "react";
import { WordTrainer } from "./WordTrainer";
import { wordBank } from "../domain/wordBank";
import { playAnswerFeedbackSound } from "../logic/feedbackSound";
import { advanceSession, createSessionState, evaluateAnswer, getCurrentSessionItem } from "../logic/sessionEngine";
import type { ProgressStoreState } from "../store/progressStore";
import type { LearningSessionState } from "../logic/sessionEngine";
import type { VocabularyWord } from "../types";

type TrainingSessionProps = {
  progress: ProgressStoreState;
  onExit: () => void;
  onProgressChange: (nextProgress: ProgressStoreState) => void;
  title?: string;
  kicker?: string;
};

const AUTO_ADVANCE_MS = 5000;
const CORRECT_ADVANCE_MS = 1000;
const COUNTDOWN_TICK_MS = 50;
const SESSION_SIZE = 25;

const wordBankById = new Map(wordBank.map((word) => [word.id, word]));

const toVocabularyWord = (wordId: string): VocabularyWord | null => {
  const word = wordBankById.get(wordId);

  if (!word) {
    return null;
  }

  return {
    dz: word.dz,
    fr: word.fr,
  };
};

export const TrainingSession = ({
  progress,
  onExit,
  onProgressChange,
  title = "Boucle de revision",
  kicker = "Session de revision",
}: TrainingSessionProps) => {
  const [sessionProgress, setSessionProgress] = useState<ProgressStoreState>(progress);
  const [sessionState, setSessionState] = useState<LearningSessionState | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect";
    message: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [countdownProgress, setCountdownProgress] = useState(0);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [pendingProgress, setPendingProgress] = useState<ProgressStoreState | null>(null);
  const [pendingSessionState, setPendingSessionState] = useState<LearningSessionState | null>(null);
  const [recallRevealed, setRecallRevealed] = useState(false);
  const [answersCount, setAnswersCount] = useState(0);

  useEffect(() => {
    setSessionProgress(progress);
    setSessionState(createSessionState({ type: "global" }, SESSION_SIZE, progress.words));
    setFeedback(null);
    setSelectedAnswer(null);
    setCountdownProgress(0);
    setPendingAdvance(false);
    setPendingProgress(null);
    setPendingSessionState(null);
    setRecallRevealed(false);
    setAnswersCount(0);
  }, [progress]);

  const currentSessionItem = sessionState ? getCurrentSessionItem(sessionState) : null;
  const currentWord = currentSessionItem ? toVocabularyWord(currentSessionItem.word_id) : null;

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
      onProgressChange(pendingProgress);
      setPendingProgress(null);
      setSelectedAnswer(null);
      setCountdownProgress(0);
      setSessionState(pendingSessionState.currentItem ? pendingSessionState : createSessionState({ type: "global" }, SESSION_SIZE, pendingProgress.words));
      setPendingSessionState(null);
      setRecallRevealed(false);
    }, advanceDelay);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(timerId);
    };
  }, [feedback?.type, onProgressChange, pendingAdvance, pendingProgress, pendingSessionState]);

  const handleAdvance = () => {
    if (!pendingProgress || !pendingSessionState) {
      return;
    }

    setFeedback(null);
    setPendingAdvance(false);
    setSessionProgress(pendingProgress);
    onProgressChange(pendingProgress);
    setPendingProgress(null);
    setSelectedAnswer(null);
    setCountdownProgress(0);
    setSessionState(pendingSessionState.currentItem ? pendingSessionState : createSessionState({ type: "global" }, SESSION_SIZE, pendingProgress.words));
    setPendingSessionState(null);
    setRecallRevealed(false);
  };

  const handleEvaluation = (submittedAnswer: string | undefined, selfAssessedCorrect?: boolean) => {
    if (!currentSessionItem || !sessionState) {
      return;
    }

    const evaluation = evaluateAnswer(currentSessionItem, {
      value: submittedAnswer,
      self_assessed_correct: selfAssessedCorrect,
    });
    const nextResult = advanceSession(sessionState, sessionProgress.words, evaluation);
    const nextProgress: ProgressStoreState = {
      words: nextResult.progress,
    };

    setSelectedAnswer(submittedAnswer ?? (selfAssessedCorrect ? "__recall_correct__" : "__recall_incorrect__"));
    playAnswerFeedbackSound(evaluation.is_correct);
    setFeedback({
      type: evaluation.is_correct ? "correct" : "incorrect",
      message: "",
    });
    setPendingAdvance(true);
    setPendingProgress(nextProgress);
    setPendingSessionState(nextResult.session);
    setCountdownProgress(1);
    setAnswersCount((value) => value + 1);
  };

  if (!currentSessionItem || !currentWord) {
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
      </div>
    );
  }

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

      {currentSessionItem.mode === "mcq" ? (
        <WordTrainer
          countdownProgress={countdownProgress}
          feedback={feedback}
          helperText="Choisis la bonne traduction parmi quatre cartes."
          isAnswered={pendingAdvance}
          mode="question"
          onContinue={handleAdvance}
          onNextExposure={() => undefined}
          onSubmit={(answer) => handleEvaluation(answer)}
          options={currentSessionItem.options}
          progressLabel={`Reponses donnees : ${answersCount}`}
          selectedAnswer={selectedAnswer}
          showAnsweredControls={feedback?.type !== "correct"}
          word={currentWord}
        />
      ) : (
        <section className="trainer-card">
          <div className="trainer-card__content">
            <p className="eyebrow">{`Reponses donnees : ${answersCount}`}</p>
            <h2 className="trainer-word">{currentWord.dz}</h2>
            {!recallRevealed ? (
              <button className="primary-button" onClick={() => setRecallRevealed(true)} type="button">
                Afficher la reponse
              </button>
            ) : (
              <>
                <p className="trainer-translation">{currentWord.fr}</p>
                <div className="choice-grid">
                  <button
                    className="choice-card"
                    disabled={pendingAdvance}
                    onClick={() => handleEvaluation(undefined, true)}
                    type="button"
                  >
                    Je l'avais
                  </button>
                  <button
                    className="choice-card"
                    disabled={pendingAdvance}
                    onClick={() => handleEvaluation(undefined, false)}
                    type="button"
                  >
                    Je me suis trompe
                  </button>
                </div>
              </>
            )}

            {pendingAdvance && feedback?.type !== "correct" ? (
              <div className="countdown-block">
                <div className="countdown-bar" aria-hidden="true">
                  <div className="countdown-bar__fill" style={{ width: `${Math.max(0, Math.min(1, countdownProgress)) * 100}%` }} />
                </div>
                <button className="primary-button trainer-next-button" onClick={handleAdvance} type="button">
                  Passer tout de suite
                </button>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
};

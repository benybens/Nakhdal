import { useEffect, useMemo, useState } from "react";
import { VocabularyWord } from "../types";

type FeedbackState =
  | {
      type: "correct";
      message: string;
    }
  | {
      type: "incorrect";
      message: string;
    }
  | null;

type WordTrainerProps = {
  mode: "exposure" | "question";
  word: VocabularyWord;
  progressLabel: string;
  helperText?: string;
  feedback: FeedbackState;
  isAnswered?: boolean;
  options?: string[];
  countdownProgress?: number;
  getOptionLabel?: (option: string) => string;
  selectedAnswer?: string | null;
  showAnsweredControls?: boolean;
  translationLabel?: string;
  onSubmit: (answer: string) => void;
  onNextExposure: () => void;
  onContinue?: () => void;
};

type DisplayedQuestion = {
  mode: "exposure" | "question";
  word: VocabularyWord;
  progressLabel: string;
  helperText?: string;
  options: string[];
  translationLabel?: string;
};

const QUESTION_TRANSITION_MS = 250;

export const WordTrainer = ({
  mode,
  word,
  progressLabel,
  helperText,
  feedback,
  isAnswered = false,
  options = [],
  countdownProgress = 0,
  getOptionLabel,
  selectedAnswer = null,
  showAnsweredControls = true,
  translationLabel,
  onSubmit,
  onNextExposure,
  onContinue,
}: WordTrainerProps) => {
  const questionKey = useMemo(
    () => `${mode}:${word.dz}:${word.fr}:${translationLabel ?? ""}:${options.join("|")}`,
    [mode, options, translationLabel, word.dz, word.fr],
  );
  const [displayedQuestion, setDisplayedQuestion] = useState<DisplayedQuestion>({
    mode,
    word,
    progressLabel,
    helperText,
    options,
    translationLabel,
  });
  const [displayedQuestionKey, setDisplayedQuestionKey] = useState(questionKey);
  const [transitionPhase, setTransitionPhase] = useState<"visible" | "fading-out" | "fading-in">("visible");

  useEffect(() => {
    if (questionKey === displayedQuestionKey) {
      setDisplayedQuestion({
        mode,
        word,
        progressLabel,
        helperText,
        options,
        translationLabel,
      });
      return;
    }

    setTransitionPhase("fading-out");

    const swapTimer = window.setTimeout(() => {
      setDisplayedQuestion({
        mode,
        word,
        progressLabel,
        helperText,
        options,
        translationLabel,
      });
      setDisplayedQuestionKey(questionKey);
      setTransitionPhase("fading-in");
    }, QUESTION_TRANSITION_MS);

    const settleTimer = window.setTimeout(() => {
      setTransitionPhase("visible");
    }, QUESTION_TRANSITION_MS * 2);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(settleTimer);
    };
  }, [displayedQuestionKey, helperText, mode, options, progressLabel, questionKey, translationLabel, word]);

  const renderedMode = displayedQuestion.mode;
  const renderedWord = displayedQuestion.word;
  const renderedOptions = displayedQuestion.options;
  const renderedProgressLabel = displayedQuestion.progressLabel;
  const renderedHelperText = displayedQuestion.helperText;
  const renderedTranslationLabel = displayedQuestion.translationLabel;

  return (
    <section className={`trainer-card trainer-card--${transitionPhase}`}>
      <div className="trainer-card__content">
        <p className="eyebrow">{renderedProgressLabel}</p>
        <h2 className="trainer-word">{renderedWord.dz}</h2>

        {renderedMode === "exposure" ? (
          <>
            <p className="trainer-translation">{renderedTranslationLabel ?? renderedWord.fr}</p>
            <button className="primary-button" onClick={onNextExposure} type="button">
              J'ai compris
            </button>
          </>
        ) : (
          <div className="choice-grid">
            {renderedOptions.map((option) => {
              const isCorrectOption = option === renderedWord.fr;
              const isSelectedWrong = isAnswered && selectedAnswer === option && !isCorrectOption;
              const stateClass = !isAnswered
                ? ""
                : isCorrectOption
                  ? "choice-card--correct"
                  : isSelectedWrong
                    ? "choice-card--selected-wrong"
                    : "choice-card--disabled";

              return (
                <button
                  key={option}
                  className={`choice-card ${stateClass}`.trim()}
                  disabled={isAnswered}
                  onClick={() => onSubmit(option)}
                  type="button"
                >
                  {getOptionLabel ? getOptionLabel(option) : option}
                </button>
              );
            })}
          </div>
        )}

        {renderedMode === "question" && isAnswered && showAnsweredControls ? (
          <div className="countdown-block">
            <div className="countdown-bar" aria-hidden="true">
              <div className="countdown-bar__fill" style={{ width: `${Math.max(0, Math.min(1, countdownProgress)) * 100}%` }} />
            </div>
            <button className="primary-button trainer-next-button" onClick={onContinue} type="button">
              Passer tout de suite
            </button>
          </div>
        ) : null}

        {renderedHelperText ? <p className="helper-text">{renderedHelperText}</p> : null}

        {feedback?.message ? (
          <p className={`feedback feedback--${feedback.type}`}>{feedback.message}</p>
        ) : null}
      </div>
    </section>
  );
};

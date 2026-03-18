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
  translationLabel?: string;
  onSubmit: (answer: string) => void;
  onNextExposure: () => void;
  onContinue?: () => void;
};

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
  translationLabel,
  onSubmit,
  onNextExposure,
  onContinue,
}: WordTrainerProps) => {
  return (
    <section className="trainer-card">
      <p className="eyebrow">{progressLabel}</p>
      <h2 className="trainer-word">{word.dz}</h2>

      {mode === "exposure" ? (
        <>
          <p className="trainer-translation">{translationLabel ?? word.fr}</p>
          <button className="primary-button" onClick={onNextExposure} type="button">
            J'ai compris
          </button>
        </>
      ) : (
        <div className="choice-grid">
          {options.map((option) => {
            const isCorrectOption = option === word.fr;
            const stateClass = !isAnswered
              ? ""
              : isCorrectOption
                ? "choice-card--correct"
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

      {mode === "question" && isAnswered ? (
        <div className="countdown-block">
          <div className="countdown-bar" aria-hidden="true">
            <div className="countdown-bar__fill" style={{ width: `${Math.max(0, Math.min(1, countdownProgress)) * 100}%` }} />
          </div>
          <button className="primary-button trainer-next-button" onClick={onContinue} type="button">
            Passer tout de suite
          </button>
        </div>
      ) : null}

      {helperText ? <p className="helper-text">{helperText}</p> : null}

      {feedback ? (
        <p className={`feedback feedback--${feedback.type}`}>{feedback.message}</p>
      ) : null}
    </section>
  );
};
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
          <p className="trainer-translation">{word.fr}</p>
          <button className="primary-button" onClick={onNextExposure} type="button">
            Suivant
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
                {option}
              </button>
            );
          })}
        </div>
      )}

      {mode === "question" && isAnswered ? (
        <button className="primary-button trainer-next-button" onClick={onContinue} type="button">
          Suivant
        </button>
      ) : null}

      {helperText ? <p className="helper-text">{helperText}</p> : null}

      {feedback ? (
        <p className={`feedback feedback--${feedback.type}`}>{feedback.message}</p>
      ) : null}
    </section>
  );
};

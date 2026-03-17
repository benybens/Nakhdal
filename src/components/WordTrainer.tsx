import { FormEvent, useEffect, useState } from "react";
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
  onSubmit,
  onNextExposure,
  onContinue,
}: WordTrainerProps) => {
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    setAnswer("");
  }, [word.dz, mode, isAnswered]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(answer);
  };

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
        <form className="trainer-form" onSubmit={handleSubmit}>
          <input
            autoComplete="off"
            autoFocus
            className="trainer-input"
            disabled={isAnswered}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Tape la traduction en francais"
            value={answer}
          />
          {isAnswered ? (
            <button className="primary-button" onClick={onContinue} type="button">
              Suivant
            </button>
          ) : (
            <button className="primary-button" type="submit">
              Valider
            </button>
          )}
        </form>
      )}

      {helperText ? <p className="helper-text">{helperText}</p> : null}

      {feedback ? (
        <p className={`feedback feedback--${feedback.type}`}>{feedback.message}</p>
      ) : null}
    </section>
  );
};

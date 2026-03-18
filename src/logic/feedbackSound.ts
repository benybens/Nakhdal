import correctSoundUrl from "../audio/UI/correct_sound.mp3";
import failSoundUrl from "../audio/UI/fail_sound.wav";

let correctAudio: HTMLAudioElement | null = null;
let incorrectAudio: HTMLAudioElement | null = null;

const createAudio = (src: string) => {
  if (typeof window === "undefined") {
    return null;
  }

  const audio = new Audio(src);
  audio.preload = "auto";
  audio.load();
  return audio;
};

const getCorrectAudio = () => {
  if (!correctAudio) {
    correctAudio = createAudio(correctSoundUrl);
  }

  return correctAudio;
};

const getIncorrectAudio = () => {
  if (!incorrectAudio) {
    incorrectAudio = createAudio(failSoundUrl);
  }

  return incorrectAudio;
};

const playAudio = (audio: HTMLAudioElement | null) => {
  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  void audio.play().catch(() => {
    const retry = audio.cloneNode(true);
    if (!(retry instanceof HTMLAudioElement)) {
      return;
    }

    retry.preload = "auto";
    retry.currentTime = 0;
    void retry.play().catch(() => undefined);
  });
};

export const primeFeedbackAudio = () => {
  void getCorrectAudio();
  void getIncorrectAudio();
};

export const playAnswerFeedbackSound = (isCorrect: boolean) => {
  playAudio(isCorrect ? getCorrectAudio() : getIncorrectAudio());
};

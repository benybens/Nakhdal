import correctSoundUrl from "../audio/UI/correct_sound.mp3";
import failSoundUrl from "../audio/UI/fail_sound.wav";

let correctAudio: HTMLAudioElement | null = null;
let incorrectAudio: HTMLAudioElement | null = null;
let uiFeedbackVolume = 0.8;
const activePlayers = new Set<HTMLAudioElement>();

const createAudio = (src: string) => {
  if (typeof window === "undefined") {
    return null;
  }

  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = uiFeedbackVolume;
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

  const player = audio.cloneNode(true);
  if (!(player instanceof HTMLAudioElement)) {
    return;
  }

  player.preload = "auto";
  player.volume = uiFeedbackVolume;
  player.currentTime = 0;
  activePlayers.add(player);

  const cleanup = () => {
    activePlayers.delete(player);
    player.removeEventListener("ended", cleanup);
    player.removeEventListener("error", cleanup);
  };

  player.addEventListener("ended", cleanup);
  player.addEventListener("error", cleanup);

  void player.play().catch(() => {
    cleanup();
  });
};

export const setUiFeedbackVolume = (volume: number) => {
  uiFeedbackVolume = Math.max(0, Math.min(1, volume));

  if (correctAudio) {
    correctAudio.volume = uiFeedbackVolume;
  }

  if (incorrectAudio) {
    incorrectAudio.volume = uiFeedbackVolume;
  }
};

export const primeFeedbackAudio = () => {
  void getCorrectAudio();
  void getIncorrectAudio();
};

export const playAnswerFeedbackSound = (isCorrect: boolean) => {
  playAudio(isCorrect ? getCorrectAudio() : getIncorrectAudio());
};

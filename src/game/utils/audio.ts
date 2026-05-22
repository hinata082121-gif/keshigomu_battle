type SoundName = 'tap' | 'shot' | 'hit' | 'fall' | 'win' | 'lose' | 'copy';

let audioContext: AudioContext | undefined;
let muted = (() => {
  try {
    return localStorage.getItem('eraser-battle-muted') === 'true';
  } catch {
    return false;
  }
})();

const getContext = (): AudioContext | undefined => {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
    return audioContext;
  } catch {
    return undefined;
  }
};

const playTone = (frequency: number, duration: number, type: OscillatorType, volume: number, delay = 0): void => {
  if (muted) {
    return;
  }

  const context = getContext();
  if (!context) {
    return;
  }

  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

export const playSound = (name: SoundName): void => {
  switch (name) {
    case 'tap':
      playTone(520, 0.055, 'square', 0.035);
      break;
    case 'shot':
      playTone(190, 0.07, 'sawtooth', 0.045);
      playTone(330, 0.055, 'square', 0.025, 0.035);
      break;
    case 'hit':
      playTone(760, 0.045, 'square', 0.04);
      playTone(420, 0.055, 'triangle', 0.025, 0.025);
      break;
    case 'fall':
      playTone(210, 0.08, 'triangle', 0.04);
      playTone(120, 0.13, 'sine', 0.038, 0.06);
      break;
    case 'win':
      playTone(523, 0.08, 'square', 0.035);
      playTone(659, 0.08, 'square', 0.034, 0.085);
      playTone(784, 0.12, 'square', 0.036, 0.17);
      break;
    case 'lose':
      playTone(330, 0.09, 'triangle', 0.036);
      playTone(247, 0.14, 'triangle', 0.032, 0.09);
      break;
    case 'copy':
      playTone(620, 0.055, 'square', 0.032);
      playTone(880, 0.08, 'square', 0.03, 0.055);
      break;
  }
};

export const isMuted = (): boolean => muted;

export const toggleMuted = (): boolean => {
  muted = !muted;
  try {
    localStorage.setItem('eraser-battle-muted', String(muted));
  } catch {
    // Ignore storage failures; sound still toggles for the current session.
  }
  if (!muted) {
    playSound('tap');
  }
  return muted;
};

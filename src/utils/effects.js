import confetti from 'canvas-confetti';

export function celebrateLevelUp() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#1D9E75', '#5DCAA5', '#E1F5EE', '#FFD700', '#FF6B6B'],
  });
}

export function celebrateCorrect() {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: ['#1D9E75', '#5DCAA5'],
    scalar: 0.8,
  });
}

const audioCtx = typeof window !== 'undefined'
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  if (!audioCtx) return;
  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

export function soundCorrect() {
  playTone(523, 0.1);
  setTimeout(() => playTone(659, 0.1), 100);
  setTimeout(() => playTone(784, 0.15), 200);
}

export function soundWrong() {
  playTone(200, 0.3, 'sawtooth', 0.2);
}

export function soundLevelUp() {
  playTone(523, 0.1);
  setTimeout(() => playTone(659, 0.1), 100);
  setTimeout(() => playTone(784, 0.1), 200);
  setTimeout(() => playTone(1047, 0.3), 300);
}
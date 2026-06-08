/**
 * Tiny Web Audio sound engine — no asset files. Tones are synthesised on the
 * fly so the bundle stays asset-free and works offline. The AudioContext is
 * created lazily on first use (after a user gesture) to satisfy autoplay rules.
 */

export type SoundName = "hit" | "miss" | "sink" | "win" | "lose";

let ctx: AudioContext | null = null;
let muted = false;

type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

interface Tone {
  freq: number;
  /** seconds */
  duration: number;
  type?: OscillatorType;
  /** seconds from "now" */
  delay?: number;
  gain?: number;
}

function playTone(audio: AudioContext, tone: Tone): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + (tone.delay ?? 0);
  const peak = tone.gain ?? 0.18;

  osc.type = tone.type ?? "sine";
  osc.frequency.setValueAtTime(tone.freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);

  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + tone.duration + 0.02);
}

const SOUNDS: Record<SoundName, Tone[]> = {
  miss: [{ freq: 180, duration: 0.18, type: "sine", gain: 0.12 }],
  hit: [
    { freq: 320, duration: 0.16, type: "square", gain: 0.16 },
    { freq: 120, duration: 0.22, type: "sawtooth", gain: 0.14, delay: 0.04 },
  ],
  sink: [
    { freq: 200, duration: 0.18, type: "sawtooth" },
    { freq: 150, duration: 0.2, type: "sawtooth", delay: 0.14 },
    { freq: 90, duration: 0.3, type: "sawtooth", delay: 0.28 },
  ],
  win: [
    { freq: 523, duration: 0.18, type: "triangle" },
    { freq: 659, duration: 0.18, type: "triangle", delay: 0.16 },
    { freq: 784, duration: 0.18, type: "triangle", delay: 0.32 },
    { freq: 1047, duration: 0.32, type: "triangle", delay: 0.48 },
  ],
  lose: [
    { freq: 392, duration: 0.22, type: "triangle" },
    { freq: 311, duration: 0.22, type: "triangle", delay: 0.2 },
    { freq: 233, duration: 0.4, type: "triangle", delay: 0.4 },
  ],
};

export function playSound(name: SoundName): void {
  if (muted) return;
  const audio = getContext();
  if (!audio) return;
  // Resume if the context was suspended before the first gesture.
  if (audio.state === "suspended") void audio.resume();
  for (const tone of SOUNDS[name]) playTone(audio, tone);
}

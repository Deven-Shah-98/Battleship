/**
 * Web Audio sound engine with sound variety — no asset files. Tones are
 * synthesized on the fly. Multiple variants per sound for variety.
 */

export type SoundName =
  | "hit"
  | "miss"
  | "sink"
  | "win"
  | "lose"
  | "radar"
  | "sonar"
  | "airstrike"
  | "place"
  | "turn"
  | "achievement"
  | "levelup"
  | "countdown"
  | "weather"
  | "mine"
  | "ability"
  | "click";

let ctx: AudioContext | null = null;
let muted = false;
let musicPlaying = false;
let musicGain: GainNode | null = null;
let musicOscillators: OscillatorNode[] = [];

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
  if (value) stopMusic();
}

export function isMuted(): boolean {
  return muted;
}

interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
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

const SOUNDS: Record<SoundName, Tone[][]> = {
  miss: [
    [{ freq: 180, duration: 0.18, type: "sine", gain: 0.12 }],
    [{ freq: 200, duration: 0.15, type: "sine", gain: 0.1 }],
    [{ freq: 160, duration: 0.2, type: "sine", gain: 0.11 }],
    [{ freq: 190, duration: 0.16, type: "triangle", gain: 0.1 }],
  ],
  hit: [
    [
      { freq: 320, duration: 0.16, type: "square", gain: 0.16 },
      { freq: 120, duration: 0.22, type: "sawtooth", gain: 0.14, delay: 0.04 },
    ],
    [
      { freq: 350, duration: 0.14, type: "square", gain: 0.15 },
      { freq: 140, duration: 0.2, type: "sawtooth", gain: 0.12, delay: 0.05 },
    ],
    [
      { freq: 300, duration: 0.18, type: "square", gain: 0.14 },
      { freq: 100, duration: 0.24, type: "sawtooth", gain: 0.13, delay: 0.03 },
    ],
  ],
  sink: [
    [
      { freq: 200, duration: 0.18, type: "sawtooth" },
      { freq: 150, duration: 0.2, type: "sawtooth", delay: 0.14 },
      { freq: 90, duration: 0.3, type: "sawtooth", delay: 0.28 },
    ],
    [
      { freq: 180, duration: 0.2, type: "sawtooth" },
      { freq: 130, duration: 0.22, type: "sawtooth", delay: 0.16 },
      { freq: 80, duration: 0.32, type: "sawtooth", delay: 0.3 },
    ],
  ],
  win: [
    [
      { freq: 523, duration: 0.18, type: "triangle" },
      { freq: 659, duration: 0.18, type: "triangle", delay: 0.16 },
      { freq: 784, duration: 0.18, type: "triangle", delay: 0.32 },
      { freq: 1047, duration: 0.32, type: "triangle", delay: 0.48 },
    ],
  ],
  lose: [
    [
      { freq: 392, duration: 0.22, type: "triangle" },
      { freq: 311, duration: 0.22, type: "triangle", delay: 0.2 },
      { freq: 233, duration: 0.4, type: "triangle", delay: 0.4 },
    ],
  ],
  radar: [
    [
      { freq: 800, duration: 0.08, type: "sine", gain: 0.1 },
      { freq: 600, duration: 0.08, type: "sine", gain: 0.1, delay: 0.1 },
      { freq: 800, duration: 0.08, type: "sine", gain: 0.1, delay: 0.2 },
    ],
  ],
  sonar: [
    [
      { freq: 440, duration: 0.3, type: "sine", gain: 0.12 },
      { freq: 440, duration: 0.3, type: "sine", gain: 0.06, delay: 0.4 },
    ],
  ],
  airstrike: [
    [
      { freq: 200, duration: 0.1, type: "sawtooth", gain: 0.2 },
      { freq: 150, duration: 0.15, type: "sawtooth", gain: 0.2, delay: 0.08 },
      { freq: 100, duration: 0.2, type: "sawtooth", gain: 0.2, delay: 0.18 },
      { freq: 80, duration: 0.3, type: "sawtooth", gain: 0.15, delay: 0.3 },
    ],
  ],
  place: [
    [{ freq: 440, duration: 0.06, type: "sine", gain: 0.08 }],
    [{ freq: 460, duration: 0.05, type: "sine", gain: 0.07 }],
    [{ freq: 420, duration: 0.07, type: "sine", gain: 0.08 }],
  ],
  turn: [
    [{ freq: 660, duration: 0.08, type: "triangle", gain: 0.1 }],
    [{ freq: 680, duration: 0.07, type: "triangle", gain: 0.09 }],
  ],
  achievement: [
    [
      { freq: 523, duration: 0.12, type: "triangle", gain: 0.12 },
      { freq: 659, duration: 0.12, type: "triangle", gain: 0.12, delay: 0.1 },
      { freq: 784, duration: 0.12, type: "triangle", gain: 0.12, delay: 0.2 },
      { freq: 1047, duration: 0.24, type: "triangle", gain: 0.15, delay: 0.3 },
    ],
  ],
  levelup: [
    [
      { freq: 440, duration: 0.1, type: "triangle", gain: 0.12 },
      { freq: 554, duration: 0.1, type: "triangle", gain: 0.12, delay: 0.08 },
      { freq: 659, duration: 0.1, type: "triangle", gain: 0.12, delay: 0.16 },
      { freq: 880, duration: 0.3, type: "triangle", gain: 0.16, delay: 0.24 },
    ],
  ],
  countdown: [
    [{ freq: 800, duration: 0.06, type: "square", gain: 0.1 }],
  ],
  weather: [
    [
      { freq: 120, duration: 0.4, type: "sawtooth", gain: 0.06 },
      { freq: 80, duration: 0.6, type: "sawtooth", gain: 0.04, delay: 0.3 },
    ],
  ],
  mine: [
    [
      { freq: 100, duration: 0.3, type: "sawtooth", gain: 0.2 },
      { freq: 60, duration: 0.4, type: "sawtooth", gain: 0.18, delay: 0.1 },
      { freq: 40, duration: 0.5, type: "sawtooth", gain: 0.12, delay: 0.2 },
    ],
  ],
  ability: [
    [
      { freq: 600, duration: 0.1, type: "sine", gain: 0.1 },
      { freq: 900, duration: 0.15, type: "sine", gain: 0.12, delay: 0.08 },
    ],
  ],
  click: [
    [{ freq: 1000, duration: 0.03, type: "square", gain: 0.05 }],
  ],
};

export function playSound(name: SoundName): void {
  if (muted) return;
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  const variants = SOUNDS[name];
  const variant = variants[Math.floor(Math.random() * variants.length)];
  for (const tone of variant) playTone(audio, tone);
}

/* ─── Dynamic Soundtrack ─── */

export function startMusic(intensity: number = 0): void {
  if (muted || musicPlaying) return;
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();

  musicGain = audio.createGain();
  musicGain.gain.setValueAtTime(0.03, audio.currentTime);
  musicGain.connect(audio.destination);

  // Ambient ocean drone with intensity layers
  const baseFreqs = [55, 82.5, 110];
  musicOscillators = baseFreqs.map((freq, i) => {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    const g = audio.createGain();
    g.gain.setValueAtTime(i === 0 ? 0.03 : 0.015, audio.currentTime);
    osc.connect(g).connect(musicGain!);
    osc.start();
    return osc;
  });

  musicPlaying = true;
  updateMusicIntensity(intensity);
}

export function updateMusicIntensity(intensity: number): void {
  if (!musicGain || !musicPlaying) return;
  const audio = getContext();
  if (!audio) return;
  // intensity: 0 = calm, 1 = intense
  const vol = 0.02 + intensity * 0.04;
  musicGain.gain.linearRampToValueAtTime(vol, audio.currentTime + 0.5);
}

export function stopMusic(): void {
  if (!musicPlaying) return;
  for (const osc of musicOscillators) {
    try { osc.stop(); } catch { /* ignore */ }
  }
  musicOscillators = [];
  musicGain = null;
  musicPlaying = false;
}

/** Play a narrator line using Web Speech API. */
export function speak(text: string): void {
  if (muted) return;
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  utterance.pitch = 0.9;
  utterance.volume = 0.7;
  window.speechSynthesis.speak(utterance);
}

const NARRATOR_LINES: Record<string, string[]> = {
  hit: ["Direct hit!", "Target struck!", "Hit confirmed!", "Good shot!"],
  miss: ["Miss!", "Shot went wide.", "No contact."],
  sink: ["Ship destroyed!", "She's going down!", "Enemy vessel sunk!"],
  win: ["Victory is yours, Commander!", "All enemy ships destroyed!", "Flawless victory!"],
  lose: ["We've lost the battle.", "All ships destroyed.", "Better luck next time, Commander."],
  gameStart: ["Battle stations!", "Engage the enemy!", "All hands, prepare for battle!"],
  lowHealth: ["We're taking heavy damage!", "Hull integrity critical!", "We can't take much more of this!"],
};

let narratorEnabled = false;

export function setNarratorEnabled(enabled: boolean): void {
  narratorEnabled = enabled;
}

export function isNarratorEnabled(): boolean {
  return narratorEnabled;
}

export function narratorSpeak(event: string): void {
  if (!narratorEnabled || muted) return;
  const lines = NARRATOR_LINES[event];
  if (!lines || lines.length === 0) return;
  const line = lines[Math.floor(Math.random() * lines.length)];
  speak(line);
}

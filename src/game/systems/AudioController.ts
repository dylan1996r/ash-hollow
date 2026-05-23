export type AudioCue =
  | 'pickup'
  | 'door'
  | 'locked'
  | 'note'
  | 'stun'
  | 'hurt'
  | 'death'
  | 'complete'
  | 'shift'
  | 'step'
  | 'noise';

export interface AudioController {
  startAmbience(): void;
  setThreatLevel(level: number): void;
  playCue(cueName: AudioCue): void;
  setMuted(muted: boolean): void;
  setVolume(value: number): void;
  isMuted(): boolean;
  getVolume(): number;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class ProceduralAudioController implements AudioController {
  private context?: AudioContext;
  private master?: GainNode;
  private ambience?: OscillatorNode;
  private ambienceGain?: GainNode;
  private threat?: OscillatorNode;
  private threatGain?: GainNode;
  private muted = false;
  private volume = 0.7;
  private started = false;

  constructor(private readonly enabled: boolean) {}

  startAmbience() {
    if (!this.enabled || this.started) {
      return;
    }

    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.context.destination);

    this.ambience = this.context.createOscillator();
    this.ambience.type = 'sawtooth';
    this.ambience.frequency.value = 43;
    this.ambienceGain = this.context.createGain();
    this.ambienceGain.gain.value = 0.028;
    this.ambience.connect(this.ambienceGain).connect(this.master);
    this.ambience.start();

    this.threat = this.context.createOscillator();
    this.threat.type = 'triangle';
    this.threat.frequency.value = 71;
    this.threatGain = this.context.createGain();
    this.threatGain.gain.value = 0;
    this.threat.connect(this.threatGain).connect(this.master);
    this.threat.start();

    this.started = true;
  }

  setThreatLevel(level: number) {
    if (!this.context || !this.threatGain || !this.threat) {
      return;
    }
    const safeLevel = Math.max(0, Math.min(1, level));
    const now = this.context.currentTime;
    this.threat.frequency.setTargetAtTime(64 + safeLevel * 46, now, 0.08);
    this.threatGain.gain.setTargetAtTime(safeLevel * 0.09, now, 0.12);
  }

  playCue(cueName: AudioCue) {
    if (!this.context || !this.master || this.muted) {
      return;
    }

    const cueMap: Record<AudioCue, { frequency: number; duration: number; gain: number; type: OscillatorType }> = {
      pickup: { frequency: 330, duration: 0.09, gain: 0.045, type: 'triangle' },
      door: { frequency: 92, duration: 0.18, gain: 0.08, type: 'sawtooth' },
      locked: { frequency: 55, duration: 0.12, gain: 0.06, type: 'square' },
      note: { frequency: 190, duration: 0.1, gain: 0.035, type: 'sine' },
      stun: { frequency: 520, duration: 0.2, gain: 0.07, type: 'sawtooth' },
      hurt: { frequency: 47, duration: 0.28, gain: 0.12, type: 'sawtooth' },
      death: { frequency: 36, duration: 0.75, gain: 0.13, type: 'triangle' },
      complete: { frequency: 260, duration: 0.6, gain: 0.06, type: 'sine' },
      shift: { frequency: 74, duration: 0.85, gain: 0.1, type: 'sawtooth' },
      step: { frequency: 86, duration: 0.035, gain: 0.025, type: 'square' },
      noise: { frequency: 115, duration: 0.08, gain: 0.045, type: 'square' }
    };

    const cue = cueMap[cueName];
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = cue.type;
    oscillator.frequency.value = cue.frequency;
    gain.gain.setValueAtTime(cue.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + cue.duration);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyVolume();
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    this.applyVolume();
  }

  isMuted() {
    return this.muted;
  }

  getVolume() {
    return this.volume;
  }

  private applyVolume() {
    if (this.master) {
      this.master.gain.value = this.muted ? 0 : this.volume;
    }
  }
}

import type Phaser from 'phaser';
import { VENDOR_ASSET_KEYS, VENDOR_ASSET_PATHS } from '../data/assetManifest';

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
  preload(scene: Phaser.Scene): void;
  startAmbience(trackId?: AudioTrackId): void;
  stopAmbience(): void;
  setThreatLevel(level: number): void;
  playCue(cueName: AudioCue): void;
  playAssetCue(cueId: AssetCueId): void;
  setMuted(muted: boolean): void;
  setVolume(value: number): void;
  setChannelVolume(channel: AudioChannel, value: number): void;
  isMuted(): boolean;
  getVolume(): number;
}

export type AudioTrackId = 'dungeon' | 'dark';
export type AssetCueId = 'shift' | 'death' | 'final';
export type AudioChannel = 'master' | 'ambience' | 'sfx' | 'threat';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class ProceduralAudioController implements AudioController {
  private scene?: Phaser.Scene;
  private context?: AudioContext;
  private master?: GainNode;
  private ambience?: OscillatorNode;
  private ambienceGain?: GainNode;
  private threat?: OscillatorNode;
  private threatGain?: GainNode;
  private assetAmbience?: Phaser.Sound.BaseSound;
  private muted = false;
  private volume = 0.7;
  private channelVolumes: Record<AudioChannel, number> = {
    master: 0.7,
    ambience: 0.55,
    sfx: 0.75,
    threat: 0.8
  };
  private started = false;

  constructor(private readonly enabled: boolean) {}

  preload(scene: Phaser.Scene) {
    this.scene = scene;
    scene.load.audio(VENDOR_ASSET_KEYS.ambienceDungeon, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.ambienceDungeon]);
    scene.load.audio(VENDOR_ASSET_KEYS.ambienceDark, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.ambienceDark]);
    scene.load.audio(VENDOR_ASSET_KEYS.stingDark, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.stingDark]);
  }

  startAmbience(trackId: AudioTrackId = 'dungeon') {
    if (!this.enabled || this.started) {
      return;
    }

    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume * this.channelVolumes.master;
    this.master.connect(this.context.destination);

    this.ambience = this.context.createOscillator();
    this.ambience.type = 'sawtooth';
    this.ambience.frequency.value = 43;
    this.ambienceGain = this.context.createGain();
    this.ambienceGain.gain.value = 0.018 * this.channelVolumes.ambience;
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
    this.startAssetAmbience(trackId);
  }

  stopAmbience() {
    if (this.assetAmbience?.isPlaying) {
      this.assetAmbience.stop();
    }
  }

  setThreatLevel(level: number) {
    if (!this.context || !this.threatGain || !this.threat) {
      return;
    }
    const safeLevel = Math.max(0, Math.min(1, level));
    const now = this.context.currentTime;
    this.threat.frequency.setTargetAtTime(64 + safeLevel * 46, now, 0.08);
    this.threatGain.gain.setTargetAtTime(safeLevel * 0.09 * this.channelVolumes.threat, now, 0.12);
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
    gain.gain.setValueAtTime(cue.gain * this.channelVolumes.sfx, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + cue.duration);
  }

  playAssetCue(cueId: AssetCueId) {
    if (!this.scene || this.muted) {
      return;
    }
    const keyByCue: Record<AssetCueId, string> = {
      shift: VENDOR_ASSET_KEYS.stingDark,
      death: VENDOR_ASSET_KEYS.stingDark,
      final: VENDOR_ASSET_KEYS.ambienceDark
    };
    this.scene.sound.play(keyByCue[cueId], {
      volume: this.volume * this.channelVolumes.master * this.channelVolumes.sfx * (cueId === 'final' ? 0.34 : 0.42)
    });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyVolume();
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    this.channelVolumes.master = this.volume;
    this.applyVolume();
  }

  setChannelVolume(channel: AudioChannel, value: number) {
    this.channelVolumes[channel] = Math.max(0, Math.min(1, value));
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
	      this.master.gain.value = this.muted ? 0 : this.volume * this.channelVolumes.master;
	    }
    if (this.ambienceGain) {
      this.ambienceGain.gain.value = 0.018 * this.channelVolumes.ambience;
    }
	    if (this.assetAmbience) {
	      const sound = this.assetAmbience as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
	      sound.setVolume(this.muted ? 0 : this.volume * this.channelVolumes.ambience * 0.45);
	    }
	  }

  private startAssetAmbience(trackId: AudioTrackId) {
    if (!this.scene) {
      return;
    }
    const key = trackId === 'dark' ? VENDOR_ASSET_KEYS.ambienceDark : VENDOR_ASSET_KEYS.ambienceDungeon;
    this.assetAmbience = this.scene.sound.add(key, {
      loop: true,
      volume: this.muted ? 0 : this.volume * this.channelVolumes.ambience * 0.45
    });
    this.assetAmbience.play();
  }
}

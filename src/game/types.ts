import type Phaser from 'phaser';

export type GameState = 'menu' | 'playing' | 'paused' | 'credits' | 'dead' | 'chapter_complete';
export type ItemKind = 'flashlight' | 'fuse' | 'clinic_key' | 'battery' | 'health_item';
export type DoorKind = 'clinic' | 'basement' | 'exit';
export type EnemyState = 'dormant' | 'patrol' | 'investigate' | 'chase' | 'search' | 'stunned';
export type EnemyAlertReason = 'none' | 'sight' | 'flashlight' | 'noise' | 'damage';

export interface AssetCredit {
  id: string;
  title: string;
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  localPath: string;
  modified: boolean;
  usage: string;
}

export interface RoomData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  shiftedColor?: number;
}

export interface RoomDressingData {
  id: string;
  roomId: string;
  assetKey: string;
  x: number;
  y: number;
  frame?: number;
  scale?: number;
  tint?: number;
  alpha?: number;
  depth?: number;
  rotation?: number;
  shiftedOnly?: boolean;
  hideWhenShifted?: boolean;
  shadow?: boolean;
}

export interface WallData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PickupData {
  id: string;
  kind: ItemKind;
  label: string;
  x: number;
  y: number;
  requires?: ItemKind;
  afterFuseCount?: number;
}

export interface NoteData {
  id: string;
  title: string;
  body: string;
  x: number;
  y: number;
}

export interface DoorData {
  id: string;
  kind: DoorKind;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface PatrolPoint {
  x: number;
  y: number;
}

export interface EnemyConfig {
  visionRange: number;
  shiftedVisionRange: number;
  proximityRange: number;
  flashlightRange: number;
  visionConeDegrees: number;
  loseSightDelay: number;
  patrolArriveDistance: number;
  investigateArriveDistance: number;
  searchRetargetChance: number;
  searchDuration: number;
  chaseSearchDuration: number;
  stunDuration: number;
  damageRange: number;
  damageCooldown: number;
  noiseInvestigatePadding: number;
  minSpawnDistance: number;
  speedByState: Record<EnemyState, number>;
  fuseSpeedBonus: Partial<Record<EnemyState, number>>;
}

export interface EnemyRuntimeState {
  state: EnemyState;
  target: Phaser.Math.Vector2;
  lastKnownPlayerPosition: Phaser.Math.Vector2;
  alertReason: EnemyAlertReason;
  patrolIndex: number;
  searchUntil: number;
  stunnedUntil: number;
  lastSeenAt: number;
  lastDamageAt: number;
}

export interface Interactable {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  run: () => void;
}

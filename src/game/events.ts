export const EVENTS = {
  OBJECTIVE_STARTED: 'objective:started',
  OBJECTIVE_COMPLETED: 'objective:completed',
  FUSE_COLLECTED: 'fuse:collected',
  ROOM_SHIFTED: 'room:shifted',
  NOISE_EMITTED: 'noise:emitted',
  ENEMY_ALERTED: 'enemy:alerted',
  PLAYER_DIED: 'player:died',
  CHAPTER_COMPLETED: 'chapter:completed'
} as const;

export type GameEventName = (typeof EVENTS)[keyof typeof EVENTS];

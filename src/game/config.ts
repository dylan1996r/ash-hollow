export interface RuntimeConfig {
  isDev: boolean;
  audioEnabled: boolean;
  startingHealth: number;
  startingBattery: number;
  debugShortcutsEnabled: boolean;
}

export const GAME_CONFIG: RuntimeConfig = {
  isDev: import.meta.env.DEV,
  audioEnabled: true,
  startingHealth: 3,
  startingBattery: 100,
  debugShortcutsEnabled: import.meta.env.DEV
};

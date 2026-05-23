export interface RuntimeConfig {
  isDev: boolean;
  audioEnabled: boolean;
  buildLabel: string;
  startingHealth: number;
  startingBattery: number;
  debugShortcutsEnabled: boolean;
}

export const GAME_CONFIG: RuntimeConfig = {
  isDev: import.meta.env.DEV,
  audioEnabled: true,
  buildLabel: 'v0.3-noise-fix-2',
  startingHealth: 3,
  startingBattery: 100,
  debugShortcutsEnabled: import.meta.env.DEV
};

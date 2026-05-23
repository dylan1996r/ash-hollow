import type { EnemyConfig } from '../types';

export const BENT_ATTENDANT_CONFIG: EnemyConfig = {
  visionRange: 310,
  shiftedVisionRange: 380,
  proximityRange: 118,
  flashlightRange: 395,
  visionConeDegrees: 92,
  loseSightDelay: 720,
  patrolArriveDistance: 34,
  investigateArriveDistance: 30,
  searchRetargetChance: 0.014,
  searchDuration: 2600,
  chaseSearchDuration: 3400,
  stunDuration: 1650,
  damageRange: 32,
  damageCooldown: 1750,
  noiseInvestigatePadding: 340,
  minSpawnDistance: 480,
  speedByState: {
    dormant: 0,
    patrol: 72,
    investigate: 102,
    chase: 144,
    search: 64,
    stunned: 0
  },
  fuseSpeedBonus: {
    patrol: 7,
    investigate: 8,
    chase: 10
  }
};

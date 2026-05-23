import type { AssetCredit } from '../types';

export const VENDOR_ASSET_KEYS = {
  floorMetal: 'vendor-floor-metal',
  floorStone: 'vendor-floor-stone',
  floorWood: 'vendor-floor-wood',
  wallConcrete: 'vendor-wall-concrete',
  wallMetal: 'vendor-wall-metal',
  grungeTiles: 'vendor-grunge-tiles',
  inputPrompts: 'vendor-input-prompts',
  enemyIdle: 'vendor-enemy-idle',
  enemyMove0: 'vendor-enemy-move-0',
  enemyMove1: 'vendor-enemy-move-1',
  enemyMove2: 'vendor-enemy-move-2',
  enemyMove3: 'vendor-enemy-move-3',
  ambienceDungeon: 'vendor-ambience-dungeon',
  ambienceDark: 'vendor-ambience-dark',
  stingDark: 'vendor-sting-dark'
} as const;

export const VENDOR_ASSET_PATHS = {
  [VENDOR_ASSET_KEYS.floorMetal]: 'assets/vendor/oga-top-down-dungeon/Floor-Metal_01-64x64.png',
  [VENDOR_ASSET_KEYS.floorStone]: 'assets/vendor/oga-top-down-dungeon/Floor-Stone_04-64x64.png',
  [VENDOR_ASSET_KEYS.floorWood]: 'assets/vendor/oga-top-down-dungeon/Floor-Wood_01-64x64.png',
  [VENDOR_ASSET_KEYS.wallConcrete]: 'assets/vendor/oga-top-down-dungeon/Wall-Concrete_01-64x64.png',
  [VENDOR_ASSET_KEYS.wallMetal]: 'assets/vendor/oga-top-down-dungeon/Wall-Metal_01-64x64.png',
  [VENDOR_ASSET_KEYS.grungeTiles]: 'assets/vendor/oga-horror-tiles/grunge-tileset.png',
  [VENDOR_ASSET_KEYS.inputPrompts]: 'assets/vendor/kenney-input-prompts/tilemap_packed.png',
  [VENDOR_ASSET_KEYS.enemyIdle]: 'assets/vendor/lpc-animated-zombie/skeleton-idle_0.png',
  [VENDOR_ASSET_KEYS.enemyMove0]: 'assets/vendor/lpc-animated-zombie/skeleton-move_0.png',
  [VENDOR_ASSET_KEYS.enemyMove1]: 'assets/vendor/lpc-animated-zombie/skeleton-move_4.png',
  [VENDOR_ASSET_KEYS.enemyMove2]: 'assets/vendor/lpc-animated-zombie/skeleton-move_8.png',
  [VENDOR_ASSET_KEYS.enemyMove3]: 'assets/vendor/lpc-animated-zombie/skeleton-move_12.png',
  [VENDOR_ASSET_KEYS.ambienceDungeon]: 'assets/vendor/lpc-dungeon-ambience/dungeon_ambient_1.ogg',
  [VENDOR_ASSET_KEYS.ambienceDark]: 'assets/vendor/oga-dark-ambiences/ambience-2.wav',
  [VENDOR_ASSET_KEYS.stingDark]: 'assets/vendor/oga-dark-ambiences/ambience-5.wav'
} as const;

export const ASSET_MANIFEST: Record<'tiles' | 'overlays' | 'sprites' | 'ui' | 'audio', AssetCredit[]> = {
  tiles: [
    {
      id: 'oga-top-down-dungeon',
      title: 'Top Down Dungeon Pack',
      creator: 'Screaming Brain Studios',
      sourceUrl: 'https://opengameart.org/content/top-down-dungeon-pack',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      localPath: 'public/assets/vendor/oga-top-down-dungeon/',
      modified: true,
      usage: 'Selected 64x64 floor and wall tiles used as decorative room overlays.'
    }
  ],
  overlays: [
    {
      id: 'oga-horror-tile-set',
      title: 'Horror Tile Set',
      creator: 'Luis Zuno / ansimuz',
      sourceUrl: 'https://opengameart.org/content/horror-tile-set',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      localPath: 'public/assets/vendor/oga-horror-tiles/grunge-tileset.png',
      modified: true,
      usage: 'Tinted and scaled as grime, rot, and reality-shift overlays.'
    }
  ],
  sprites: [
    {
      id: 'lpc-animated-top-down-zombie',
      title: 'Animated Top Down Zombie',
      creator: 'Riley Gombart / ChessMasterRiley',
      sourceUrl: 'https://lpc.opengameart.org/content/animated-top-down-zombie',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      localPath: 'public/assets/vendor/lpc-animated-zombie/',
      modified: true,
      usage: 'Selected frames are tinted and scaled as The Bent Attendant silhouette.'
    }
  ],
  ui: [
    {
      id: 'kenney-input-prompts-pixel',
      title: 'Input Prompts Pixel',
      creator: 'Kenney',
      sourceUrl: 'https://kenney.nl/assets/input-prompts-pixel',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      localPath: 'public/assets/vendor/kenney-input-prompts/tilemap_packed.png',
      modified: false,
      usage: 'Keyboard prompt glyph sheet used on menus, pause UI, and interaction prompts.'
    }
  ],
  audio: [
    {
      id: 'lpc-loopable-dungeon-ambience',
      title: 'Loopable Dungeon Ambience',
      creator: 'JaggedStone',
      sourceUrl: 'https://lpc.opengameart.org/content/loopable-dungeon-ambience',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      localPath: 'public/assets/vendor/lpc-dungeon-ambience/dungeon_ambient_1.ogg',
      modified: false,
      usage: 'Looped ambience layer after audio unlock.'
    },
    {
      id: 'oga-dark-ambiences',
      title: 'Dark Ambiences',
      creator: 'Ogrebane',
      sourceUrl: 'https://opengameart.org/content/dark-ambiences',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      localPath: 'public/assets/vendor/oga-dark-ambiences/',
      modified: false,
      usage: 'Dark ambience and stinger layers for shifts, death, and final pressure.'
    }
  ]
};

export const FLAT_ASSET_CREDITS = Object.values(ASSET_MANIFEST).flat();

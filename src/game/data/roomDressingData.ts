import { VENDOR_ASSET_KEYS } from './assetManifest';
import type { RoomDressingData } from '../types';

export const ROOM_DRESSING: RoomDressingData[] = [
  { id: 'diner-counter', roomId: 'diner', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 72, x: 920, y: 565, scale: 2.7, tint: 0x8f6a57, alpha: 0.82, depth: 7, shadow: true },
  { id: 'diner-table-a', roomId: 'diner', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 54, x: 780, y: 650, scale: 2.4, tint: 0x7a5949, alpha: 0.72, depth: 7, shadow: true },
  { id: 'diner-table-b', roomId: 'diner', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 55, x: 1055, y: 665, scale: 2.2, tint: 0x6d4b40, alpha: 0.68, depth: 7, shadow: true },
  { id: 'diner-rotten-sign', roomId: 'diner', assetKey: VENDOR_ASSET_KEYS.interiorSpritesheet, frame: 27, x: 1115, y: 510, scale: 2.6, tint: 0xa98562, alpha: 0.62, depth: 7 },

  { id: 'motel-desk', roomId: 'motel', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 70, x: 365, y: 175, scale: 2.8, tint: 0x5e5f55, alpha: 0.76, depth: 7, shadow: true },
  { id: 'motel-file-box', roomId: 'motel', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 106, x: 565, y: 220, scale: 2.2, tint: 0x777068, alpha: 0.7, depth: 7, shadow: true },
  { id: 'motel-lamp', roomId: 'motel', assetKey: VENDOR_ASSET_KEYS.interiorSpritesheet, frame: 8, x: 250, y: 225, scale: 2.4, tint: 0xb3aa8e, alpha: 0.55, depth: 7 },

  { id: 'clinic-intake', roomId: 'clinic', assetKey: VENDOR_ASSET_KEYS.scifiInterior, frame: 68, x: 1130, y: 95, scale: 2.9, tint: 0x71827b, alpha: 0.62, depth: 7, shadow: true },
  { id: 'clinic-chair-row', roomId: 'clinic', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 86, x: 915, y: 215, scale: 2.4, tint: 0x66706a, alpha: 0.68, depth: 7, shadow: true },
  { id: 'clinic-panel-a', roomId: 'clinic', assetKey: VENDOR_ASSET_KEYS.scifiInterior, frame: 57, x: 1290, y: 315, scale: 2.5, tint: 0x566f6b, alpha: 0.58, depth: 7 },
  { id: 'clinic-shift-scar', roomId: 'clinic', assetKey: VENDOR_ASSET_KEYS.grungeTiles, x: 1210, y: 190, scale: 0.55, tint: 0x8b3830, alpha: 0.22, depth: 9, shiftedOnly: true },

  { id: 'storage-shelves', roomId: 'storage', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 90, x: 1665, y: 150, scale: 2.8, tint: 0x5c6d5e, alpha: 0.72, depth: 7, shadow: true },
  { id: 'storage-crate', roomId: 'storage', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 105, x: 1810, y: 215, scale: 2.5, tint: 0x685549, alpha: 0.7, depth: 7, shadow: true },
  { id: 'storage-leak', roomId: 'storage', assetKey: VENDOR_ASSET_KEYS.grungeTiles, x: 1745, y: 245, scale: 0.35, tint: 0x572822, alpha: 0.24, depth: 9 },

  { id: 'fuse-machine', roomId: 'fuse', assetKey: VENDOR_ASSET_KEYS.scifiInterior, frame: 79, x: 1595, y: 595, scale: 3.1, tint: 0x6f7164, alpha: 0.68, depth: 7, shadow: true },
  { id: 'fuse-panel', roomId: 'fuse', assetKey: VENDOR_ASSET_KEYS.scifiInterior, frame: 70, x: 1700, y: 660, scale: 2.8, tint: 0x8b6d58, alpha: 0.62, depth: 7, shadow: true },
  { id: 'fuse-warning', roomId: 'fuse', assetKey: VENDOR_ASSET_KEYS.interiorSpritesheet, frame: 34, x: 1475, y: 560, scale: 2.5, tint: 0xb29150, alpha: 0.62, depth: 7 },

  { id: 'basement-pipe-a', roomId: 'basement', assetKey: VENDOR_ASSET_KEYS.scifiInterior, frame: 21, x: 850, y: 910, scale: 3.2, tint: 0x49524c, alpha: 0.55, depth: 7, shadow: true },
  { id: 'basement-bed', roomId: 'basement', assetKey: VENDOR_ASSET_KEYS.roguelikeIndoors, frame: 109, x: 1195, y: 1050, scale: 2.8, tint: 0x594949, alpha: 0.58, depth: 7, shadow: true },
  { id: 'basement-shift-rib', roomId: 'basement', assetKey: VENDOR_ASSET_KEYS.grungeTiles, x: 1000, y: 990, scale: 0.7, tint: 0x7c302c, alpha: 0.25, depth: 9, shiftedOnly: true },

  { id: 'tunnel-bars', roomId: 'tunnel', assetKey: VENDOR_ASSET_KEYS.scifiInterior, frame: 33, x: 1795, y: 1020, scale: 3.0, tint: 0x5a6059, alpha: 0.55, depth: 7, shadow: true },
  { id: 'tunnel-foreground', roomId: 'tunnel', assetKey: VENDOR_ASSET_KEYS.grungeTiles, x: 1905, y: 1135, scale: 0.65, tint: 0x23241f, alpha: 0.36, depth: 44 }
];

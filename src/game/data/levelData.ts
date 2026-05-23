import type { DoorData, NoteData, PatrolPoint, PickupData, RoomData, WallData } from '../types';

export const WORLD_SIZE = {
  width: 2400,
  height: 1600
} as const;

export const ROOMS: RoomData[] = [
  { id: 'road', name: 'Fog Road', x: 120, y: 660, width: 620, height: 260, color: 0x242720 },
  { id: 'diner', name: 'Diner', x: 860, y: 590, width: 470, height: 300, color: 0x2b211c, shiftedColor: 0x371b18 },
  { id: 'motel', name: 'Motel Office', x: 410, y: 180, width: 450, height: 270, color: 0x232927 },
  { id: 'clinic', name: 'Clinic Lobby', x: 1070, y: 130, width: 590, height: 360, color: 0x202828, shiftedColor: 0x30201e },
  { id: 'storage', name: 'Pharmacy Storage', x: 1700, y: 170, width: 340, height: 270, color: 0x1c2521, shiftedColor: 0x331d1d },
  { id: 'fuse', name: 'Municipal Fuse Room', x: 1590, y: 620, width: 370, height: 250, color: 0x211f1b },
  { id: 'basement', name: 'Clinic Basement', x: 980, y: 990, width: 760, height: 360, color: 0x171d1e, shiftedColor: 0x321c1b },
  { id: 'tunnel', name: 'Service Tunnel', x: 1790, y: 1040, width: 410, height: 230, color: 0x151919 }
];

export const WALLS: WallData[] = [
  { x: -40, y: -40, width: 2480, height: 40 },
  { x: -40, y: 1600, width: 2480, height: 40 },
  { x: -40, y: -40, width: 40, height: 1680 },
  { x: 2400, y: -40, width: 40, height: 1680 },
  { x: 0, y: 0, width: 2400, height: 86 },
  { x: 0, y: 1455, width: 2400, height: 145 },
  { x: 0, y: 0, width: 80, height: 1600 },
  { x: 2260, y: 0, width: 140, height: 1600 },
  { x: 80, y: 500, width: 260, height: 92 },
  { x: 765, y: 500, width: 260, height: 92 },
  { x: 1340, y: 505, width: 155, height: 88 },
  { x: 1885, y: 900, width: 95, height: 140 },
  { x: 820, y: 900, width: 120, height: 110 },
  { x: 360, y: 85, width: 40, height: 460 },
  { x: 890, y: 85, width: 42, height: 390 },
  { x: 1025, y: 85, width: 40, height: 450 },
  { x: 1680, y: 85, width: 40, height: 452 },
  { x: 2045, y: 85, width: 45, height: 470 },
  { x: 930, y: 1360, width: 850, height: 45 },
  { x: 1740, y: 930, width: 45, height: 475 },
  { x: 2220, y: 930, width: 40, height: 475 }
];

export const PICKUPS: PickupData[] = [
  { id: 'flashlight', kind: 'flashlight', label: 'cracked flashlight', x: 320, y: 760 },
  { id: 'battery-road', kind: 'battery', label: '9v battery', x: 520, y: 850 },
  { id: 'fuse-diner', kind: 'fuse', label: 'warm fuse', x: 1180, y: 725 },
  { id: 'clinic-key', kind: 'clinic_key', label: 'clinic key', x: 730, y: 295 },
  { id: 'health-motel', kind: 'health_item', label: 'sealed gauze', x: 500, y: 355 },
  { id: 'fuse-motel', kind: 'fuse', label: 'numbered fuse', x: 610, y: 235 },
  { id: 'battery-clinic', kind: 'battery', label: 'drawer battery', x: 1210, y: 335, requires: 'clinic_key' },
  { id: 'fuse-storage', kind: 'fuse', label: 'blackened fuse', x: 1885, y: 265, requires: 'clinic_key' },
  { id: 'health-basement', kind: 'health_item', label: 'unmarked tonic', x: 1115, y: 1240, afterFuseCount: 2 }
];

export const NOTES: NoteData[] = [
  {
    id: 'broadcast',
    title: 'Emergency Broadcast',
    body: 'The radio repeats one sentence through the ash: "Return to intake. We kept your room open."',
    x: 260,
    y: 690
  },
  {
    id: 'ledger',
    title: 'Motel Ledger',
    body: 'Room 203 is listed seven times. The handwriting gets worse each time. The last line says: CLINIC KEY RETURNED.',
    x: 735,
    y: 230
  },
  {
    id: 'jukebox',
    title: 'Diner Jukebox Card',
    body: 'Three songs are scratched out. A note below them reads: "When the lights blink twice, do not look at the kitchen."',
    x: 1005,
    y: 785
  },
  {
    id: 'intake',
    title: 'Patient Intake',
    body: 'Your name appears on an intake sheet dated tomorrow. The attending physician field is empty except for a long black thumbprint.',
    x: 1355,
    y: 240
  },
  {
    id: 'basement-note',
    title: 'Basement Memo',
    body: 'The service tunnel opens only after municipal power is restored. Someone wrote underneath: "It opens before it forgives."',
    x: 1275,
    y: 1170
  }
];

export const DOORS: DoorData[] = [
  { id: 'clinic-door', kind: 'clinic', x: 1030, y: 350, width: 42, height: 105, label: 'Clinic door' },
  { id: 'basement-door', kind: 'basement', x: 1500, y: 485, width: 120, height: 42, label: 'Basement stairs' },
  { id: 'exit-door', kind: 'exit', x: 1760, y: 1130, width: 42, height: 130, label: 'Service tunnel gate' }
];

export const PATROL_POINTS: PatrolPoint[] = [
  { x: 1180, y: 1010 },
  { x: 1500, y: 1180 },
  { x: 1460, y: 740 },
  { x: 1260, y: 390 },
  { x: 940, y: 720 }
];

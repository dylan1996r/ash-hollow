import Phaser from 'phaser';

type GameState = 'menu' | 'playing' | 'paused' | 'dead' | 'chapter_complete';
type ItemKind = 'flashlight' | 'fuse' | 'clinic_key' | 'battery' | 'health_item';
type DoorKind = 'clinic' | 'basement' | 'exit';
type EnemyState = 'dormant' | 'patrol' | 'investigate' | 'chase' | 'search' | 'stunned';

interface RoomData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  shiftedColor?: number;
}

interface WallData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PickupData {
  id: string;
  kind: ItemKind;
  label: string;
  x: number;
  y: number;
  requires?: ItemKind;
  afterFuseCount?: number;
}

interface NoteData {
  id: string;
  title: string;
  body: string;
  x: number;
  y: number;
}

interface DoorData {
  id: string;
  kind: DoorKind;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface Interactable {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  run: () => void;
}

const EVENTS = {
  OBJECTIVE_STARTED: 'objective:started',
  OBJECTIVE_COMPLETED: 'objective:completed',
  FUSE_COLLECTED: 'fuse:collected',
  ROOM_SHIFTED: 'room:shifted',
  NOISE_EMITTED: 'noise:emitted',
  ENEMY_ALERTED: 'enemy:alerted',
  PLAYER_DIED: 'player:died',
  CHAPTER_COMPLETED: 'chapter:completed'
} as const;

const ROOMS: RoomData[] = [
  { id: 'road', name: 'Fog Road', x: 120, y: 660, width: 620, height: 260, color: 0x242720 },
  { id: 'diner', name: 'Diner', x: 860, y: 590, width: 470, height: 300, color: 0x2b211c, shiftedColor: 0x371b18 },
  { id: 'motel', name: 'Motel Office', x: 410, y: 180, width: 450, height: 270, color: 0x232927 },
  { id: 'clinic', name: 'Clinic Lobby', x: 1070, y: 130, width: 590, height: 360, color: 0x202828, shiftedColor: 0x30201e },
  { id: 'storage', name: 'Pharmacy Storage', x: 1700, y: 170, width: 340, height: 270, color: 0x1c2521, shiftedColor: 0x331d1d },
  { id: 'fuse', name: 'Municipal Fuse Room', x: 1590, y: 620, width: 370, height: 250, color: 0x211f1b },
  { id: 'basement', name: 'Clinic Basement', x: 980, y: 990, width: 760, height: 360, color: 0x171d1e, shiftedColor: 0x321c1b },
  { id: 'tunnel', name: 'Service Tunnel', x: 1790, y: 1040, width: 410, height: 230, color: 0x151919 }
];

const WALLS: WallData[] = [
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

const PICKUPS: PickupData[] = [
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

const NOTES: NoteData[] = [
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

const DOORS: DoorData[] = [
  { id: 'clinic-door', kind: 'clinic', x: 1030, y: 350, width: 42, height: 105, label: 'Clinic door' },
  { id: 'basement-door', kind: 'basement', x: 1500, y: 485, width: 120, height: 42, label: 'Basement stairs' },
  { id: 'exit-door', kind: 'exit', x: 1760, y: 1130, width: 42, height: 130, label: 'Service tunnel gate' }
];

const PATROL_POINTS = [
  new Phaser.Math.Vector2(1180, 1010),
  new Phaser.Math.Vector2(1500, 1180),
  new Phaser.Math.Vector2(1460, 740),
  new Phaser.Math.Vector2(1260, 390),
  new Phaser.Math.Vector2(940, 720)
];

export class AshHollowScene extends Phaser.Scene {
  private state: GameState = 'menu';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemy!: Phaser.Physics.Arcade.Sprite;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doorWalls!: Phaser.Physics.Arcade.StaticGroup;
  private pickups!: Phaser.GameObjects.Group;
  private notes!: Phaser.GameObjects.Group;
  private mapLayer!: Phaser.GameObjects.Container;
  private horrorLayer!: Phaser.GameObjects.Container;
  private fog!: Phaser.GameObjects.Graphics;
  private flashlight!: Phaser.GameObjects.Graphics;
  private uiText!: Phaser.GameObjects.Text;
  private centerText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private staticText!: Phaser.GameObjects.Text;
  private interactionTarget?: Interactable;
  private interactables: Interactable[] = [];
  private inventory = new Set<ItemKind>();
  private collected = new Set<string>();
  private readNotes = new Set<string>();
  private fuseCount = 0;
  private health = 3;
  private battery = 100;
  private objective = 'Find a light in the road fog.';
  private shifted = false;
  private finalSequence = false;
  private enemyState: EnemyState = 'dormant';
  private enemyTarget = new Phaser.Math.Vector2();
  private patrolIndex = 0;
  private searchUntil = 0;
  private stunnedUntil = 0;
  private lastDamageAt = 0;
  private nextFlickerAt = 0;
  private fogDrift = 0;
  private messageUntil = 0;
  private noiseMarkers: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super('ash-hollow');
  }

  preload() {
    this.createGeneratedTextures();
  }

  create() {
    this.physics.world.setBounds(0, 0, 2400, 1600);
    this.cameras.main.setBounds(0, 0, 2400, 1600);
    this.cameras.main.setBackgroundColor('#090b09');
    this.input.setDefaultCursor('crosshair');

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,F,SHIFT,SPACE,ESC,ENTER,R') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    this.createWorld();
    this.createActors();
    this.createHud();
    this.registerEvents();
    this.showMenu();
  }

  update(time: number, delta: number) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) && this.state === 'menu') {
      this.startGame();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.R) && (this.state === 'dead' || this.state === 'chapter_complete')) {
      this.restartScene();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) && this.state === 'playing') {
      this.state = 'paused';
      this.centerText.setText('PAUSED\n\nPress Esc to return');
      this.centerText.setVisible(true);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) && this.state === 'paused') {
      this.state = 'playing';
      this.centerText.setVisible(false);
    }
    if (this.state !== 'playing') {
      return;
    }

    this.updatePlayer(delta);
    this.updateInteractions();
    this.updateEnemy(time, delta);
    this.updateHorror(time, delta);
    this.updateHud(time);
  }

  private createGeneratedTextures() {
    const g = this.add.graphics();
    g.fillStyle(0xd7c9a4, 1).fillEllipse(16, 16, 24, 30);
    g.fillStyle(0x1b1c18, 1).fillCircle(16, 20, 5);
    g.generateTexture('player', 32, 32);
    g.clear();

    g.fillStyle(0x55423a, 1).fillEllipse(18, 20, 26, 36);
    g.fillStyle(0x211818, 1).fillRect(9, 4, 18, 16);
    g.lineStyle(3, 0x8f6b61, 1).lineBetween(18, 16, 10, 34).lineBetween(18, 16, 26, 34);
    g.generateTexture('attendant', 36, 42);
    g.clear();

    g.fillStyle(0xd8b85a, 1).fillRect(4, 7, 18, 10);
    g.fillStyle(0x30302a, 1).fillRect(22, 9, 5, 6);
    g.generateTexture('battery', 32, 24);
    g.clear();

    g.fillStyle(0xa04336, 1).fillRoundedRect(7, 5, 18, 22, 3);
    g.fillStyle(0x2b1917, 1).fillRect(11, 9, 10, 14);
    g.generateTexture('fuse', 32, 32);
    g.clear();

    g.fillStyle(0xbfc5b8, 1).fillRect(8, 5, 15, 22);
    g.fillStyle(0x313a35, 1).fillRect(12, 8, 7, 16);
    g.generateTexture('key', 32, 32);
    g.clear();

    g.fillStyle(0xd7d1bd, 1).fillRect(6, 9, 20, 14);
    g.fillStyle(0x7e2f2a, 1).fillRect(14, 5, 4, 22);
    g.fillStyle(0x7e2f2a, 1).fillRect(5, 14, 22, 4);
    g.generateTexture('health', 32, 32);
    g.clear();

    g.fillStyle(0xc7c0a4, 1).fillRect(7, 4, 18, 24);
    g.lineStyle(1, 0x605c51, 1).lineBetween(10, 10, 22, 10).lineBetween(10, 15, 21, 15).lineBetween(10, 20, 18, 20);
    g.generateTexture('note', 32, 32);
    g.destroy();
  }

  private createWorld() {
    this.mapLayer = this.add.container(0, 0);
    this.horrorLayer = this.add.container(0, 0);
    this.add.rectangle(1200, 800, 2400, 1600, 0x0b0d0a).setDepth(-20);

    for (const room of ROOMS) {
      const shadow = this.add.rectangle(room.x + 18, room.y + 22, room.width, room.height, 0x060706, 0.72);
      const floor = this.add.rectangle(room.x, room.y, room.width, room.height, room.color, 1);
      floor.setData('roomId', room.id);
      floor.setStrokeStyle(3, 0x3e4037, 0.75);
      const label = this.add.text(room.x - room.width / 2 + 18, room.y - room.height / 2 + 16, room.name.toUpperCase(), {
        fontSize: '13px',
        color: '#8e927f',
        fontFamily: 'monospace'
      });
      this.mapLayer.add([shadow, floor, label]);
    }

    const road = this.add.graphics();
    road.fillStyle(0x171a16, 1);
    road.fillRect(120, 500, 1780, 130);
    road.fillRect(770, 450, 150, 575);
    road.fillRect(900, 900, 1010, 120);
    road.fillRect(1860, 830, 130, 360);
    road.lineStyle(2, 0x303128, 0.45);
    for (let x = 160; x < 1900; x += 120) {
      road.lineBetween(x, 562, x + 52, 562);
    }
    this.mapLayer.add(road);

    this.walls = this.physics.add.staticGroup();
    for (const wall of WALLS) {
      const rect = this.add.rectangle(wall.x + wall.width / 2, wall.y + wall.height / 2, wall.width, wall.height, 0x080908, 0.01);
      this.physics.add.existing(rect, true);
      this.walls.add(rect);
    }

    this.doorWalls = this.physics.add.staticGroup();
    for (const door of DOORS) {
      const blocker = this.add.rectangle(door.x + door.width / 2, door.y + door.height / 2, door.width, door.height, 0x17120f, 0.95);
      blocker.setStrokeStyle(2, 0x5d4d3f, 1);
      blocker.setData('doorId', door.id);
      this.physics.add.existing(blocker, true);
      this.doorWalls.add(blocker);
      this.interactables.push({
        id: door.id,
        label: door.label,
        x: door.x + door.width / 2,
        y: door.y + door.height / 2,
        radius: 86,
        run: () => this.tryOpenDoor(door)
      });
    }

    this.pickups = this.add.group();
    for (const pickup of PICKUPS) {
      const sprite = this.physics.add.sprite(pickup.x, pickup.y, this.textureForPickup(pickup.kind));
      sprite.setData('pickup', pickup);
      sprite.setDepth(8);
      this.pickups.add(sprite);
      this.interactables.push({
        id: pickup.id,
        label: pickup.label,
        x: pickup.x,
        y: pickup.y,
        radius: 58,
        run: () => this.collectPickup(pickup, sprite)
      });
    }

    this.notes = this.add.group();
    for (const note of NOTES) {
      const sprite = this.add.sprite(note.x, note.y, 'note').setDepth(8);
      sprite.setData('note', note);
      this.notes.add(sprite);
      this.interactables.push({
        id: note.id,
        label: note.title,
        x: note.x,
        y: note.y,
        radius: 62,
        run: () => this.readNote(note)
      });
    }
  }

  private createActors() {
    this.player = this.physics.add.sprite(230, 820, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body!.setSize(20, 22).setOffset(6, 8);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.doorWalls);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.enemy = this.physics.add.sprite(1350, 1190, 'attendant');
    this.enemy.setDepth(19);
    this.enemy.setVisible(false);
    this.enemy.body!.setSize(20, 28).setOffset(8, 10);
    this.physics.add.collider(this.enemy, this.walls);
    this.physics.add.collider(this.enemy, this.doorWalls);

    this.flashlight = this.add.graphics().setDepth(40);
    this.fog = this.add.graphics().setDepth(50);
  }

  private createHud() {
    this.uiText = this.add.text(18, 16, '', {
      fontSize: '16px',
      color: '#d9d3c4',
      fontFamily: 'monospace',
      lineSpacing: 7
    });
    this.uiText.setScrollFactor(0).setDepth(80);

    this.staticText = this.add.text(18, 160, '', {
      fontSize: '14px',
      color: '#a74337',
      fontFamily: 'monospace'
    });
    this.staticText.setScrollFactor(0).setDepth(80);

    this.promptText = this.add.text(640, 650, '', {
      fontSize: '18px',
      color: '#efe6ca',
      backgroundColor: '#10110dcc',
      padding: { x: 14, y: 8 },
      fontFamily: 'monospace'
    });
    this.promptText.setOrigin(0.5).setScrollFactor(0).setDepth(90).setVisible(false);

    this.messageText = this.add.text(640, 92, '', {
      fontSize: '18px',
      color: '#efe6ca',
      backgroundColor: '#10110dcc',
      padding: { x: 18, y: 12 },
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: 820 }
    });
    this.messageText.setOrigin(0.5, 0).setScrollFactor(0).setDepth(90).setVisible(false);

    this.centerText = this.add.text(640, 350, '', {
      fontSize: '26px',
      color: '#e3ddcc',
      fontFamily: 'monospace',
      align: 'center',
      backgroundColor: '#090a08e6',
      padding: { x: 30, y: 24 },
      wordWrap: { width: 820 }
    });
    this.centerText.setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  private registerEvents() {
    this.events.on(EVENTS.FUSE_COLLECTED, () => {
      this.fuseCount += 1;
      this.emitNoise(this.player.x, this.player.y, 260);
      if (this.fuseCount === 1) {
        this.objective = 'Find the motel ledger and clinic key. Two fuses remain.';
        this.broadcast('The radio coughs: "First circuit awake. The attendant has your chart."');
        this.wakeEnemy('patrol');
      }
      if (this.fuseCount === 2) {
        this.objective = 'The town has shifted. Get the final fuse from clinic storage.';
        this.shiftRooms();
      }
      if (this.fuseCount === 3) {
        this.objective = 'Restore municipal power in the fuse room.';
        this.broadcast('A PA speaker clicks on somewhere below you: "Basement intake is ready."');
      }
    });
  }

  private showMenu() {
    this.state = 'menu';
    this.centerText.setText(
      'ASH HOLLOW\n\nA 2.5D psychological horror vertical slice\n\nWASD / Arrows move\nShift sprints and makes noise\nMouse aims flashlight\nE interacts\nF stuns nearby threat if flashlight is charged\n\nPress Enter'
    );
    this.centerText.setVisible(true);
    this.uiText.setText('');
  }

  private startGame() {
    this.state = 'playing';
    this.centerText.setVisible(false);
    this.events.emit(EVENTS.OBJECTIVE_STARTED, 'chapter');
    this.broadcast('Ash falls sideways. The road behind you is gone.');
  }

  private restartScene() {
    this.scene.restart();
  }

  private updatePlayer(delta: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const axis = new Phaser.Math.Vector2(
      Number(this.keys.D.isDown || this.cursors.right?.isDown) - Number(this.keys.A.isDown || this.cursors.left?.isDown),
      Number(this.keys.S.isDown || this.cursors.down?.isDown) - Number(this.keys.W.isDown || this.cursors.up?.isDown)
    );
    if (axis.lengthSq() > 0) {
      axis.normalize();
    }

    const sprinting = this.keys.SHIFT.isDown && axis.lengthSq() > 0;
    const speed = sprinting ? 205 : 132;
    body.setVelocity(axis.x * speed, axis.y * speed);
    this.player.setRotation(Math.atan2(axis.y, axis.x));
    if (sprinting && Math.random() < 0.03) {
      this.emitNoise(this.player.x, this.player.y, 190);
    }

    if (this.inventory.has('flashlight')) {
      this.battery = Phaser.Math.Clamp(this.battery - delta * 0.0035, 0, 100);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.F) && this.inventory.has('flashlight') && this.battery > 18) {
      this.tryStunEnemy();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) && this.interactionTarget) {
      this.interactionTarget.run();
    }
  }

  private updateInteractions() {
    let closest: Interactable | undefined;
    let closestDistance = Number.MAX_VALUE;
    for (const interactable of this.interactables) {
      if (this.collected.has(interactable.id)) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, interactable.x, interactable.y);
      if (distance < interactable.radius && distance < closestDistance) {
        closest = interactable;
        closestDistance = distance;
      }
    }
    this.interactionTarget = closest;
    this.promptText.setVisible(Boolean(closest));
    if (closest) {
      this.promptText.setText(`E  ${closest.label}`);
    }
  }

  private updateEnemy(time: number, delta: number) {
    if (this.enemyState === 'dormant') {
      return;
    }
    const distanceToPlayer = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
    const visibleRange = this.shifted ? 340 : 275;
    const flashlightAlert = this.inventory.has('flashlight') && this.battery > 0 && distanceToPlayer < 380 && this.isPointInFlashlight(this.enemy.x, this.enemy.y);

    if (this.enemyState !== 'stunned' && (distanceToPlayer < 145 || flashlightAlert)) {
      this.enemyState = 'chase';
      this.events.emit(EVENTS.ENEMY_ALERTED);
    }
    if (this.enemyState === 'stunned') {
      if (time > this.stunnedUntil) {
        this.enemyState = 'search';
        this.searchUntil = time + 1600;
      } else {
        this.enemy.setVelocity(0, 0);
        return;
      }
    }

    if (this.enemyState === 'patrol') {
      this.enemyTarget.copy(PATROL_POINTS[this.patrolIndex]);
      if (Phaser.Math.Distance.BetweenPoints(this.enemy, this.enemyTarget) < 34) {
        this.patrolIndex = (this.patrolIndex + 1) % PATROL_POINTS.length;
      }
      if (distanceToPlayer < visibleRange) {
        this.enemyState = 'investigate';
        this.enemyTarget.set(this.player.x, this.player.y);
      }
    }

    if (this.enemyState === 'investigate' && Phaser.Math.Distance.BetweenPoints(this.enemy, this.enemyTarget) < 28) {
      this.enemyState = 'search';
      this.searchUntil = time + 2200;
    }

    if (this.enemyState === 'search') {
      if (time > this.searchUntil) {
        this.enemyState = 'patrol';
      } else if (Math.random() < 0.018) {
        this.enemyTarget.set(this.enemy.x + Phaser.Math.Between(-180, 180), this.enemy.y + Phaser.Math.Between(-160, 160));
      }
    }

    if (this.enemyState === 'chase') {
      this.enemyTarget.set(this.player.x, this.player.y);
      if (distanceToPlayer > 520) {
        this.enemyState = 'search';
        this.searchUntil = time + 2400;
      }
      if (distanceToPlayer < 35 && time - this.lastDamageAt > 1150) {
        this.damagePlayer();
        this.lastDamageAt = time;
      }
    }

    const speedByState: Record<EnemyState, number> = {
      dormant: 0,
      patrol: 82 + this.fuseCount * 9,
      investigate: 118 + this.fuseCount * 10,
      chase: 168 + this.fuseCount * 14,
      search: 74,
      stunned: 0
    };
    this.physics.moveToObject(this.enemy, this.enemyTarget, speedByState[this.enemyState], delta);
  }

  private updateHorror(time: number, delta: number) {
    this.fogDrift += delta * 0.00018;
    this.drawFlashlight();
    this.drawFog();

    if (time > this.nextFlickerAt) {
      this.nextFlickerAt = time + Phaser.Math.Between(1800, 4800);
      if (Math.random() < (this.shifted ? 0.78 : 0.42)) {
        this.cameras.main.flash(90, 185, 170, 130, false);
      }
    }

    if (this.enemyState !== 'dormant') {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.enemy.x, this.enemy.y);
      const intensity = Phaser.Math.Clamp(1 - distance / 720, 0, 1);
      this.staticText.setText(intensity > 0.08 ? `RADIO STATIC ${'#'.repeat(Math.ceil(intensity * 12))}` : '');
    }

    this.noiseMarkers = this.noiseMarkers.filter((marker) => {
      marker.setAlpha(marker.alpha - 0.02);
      if (marker.alpha <= 0) {
        marker.destroy();
        return false;
      }
      return true;
    });

    if (this.messageText.visible && time > this.messageUntil) {
      this.messageText.setVisible(false);
    }
  }

  private updateHud(time: number) {
    const stateLabel = this.enemyState === 'dormant' ? 'quiet' : this.enemyState;
    this.uiText.setText(
      [
        `Health: ${'|'.repeat(this.health)}${'.'.repeat(3 - this.health)}`,
        `Battery: ${Math.round(this.battery)}%`,
        `Fuses: ${this.fuseCount}/3`,
        `Threat: ${stateLabel}`,
        '',
        this.objective
      ].join('\n')
    );

    if (this.finalSequence && time % 900 < 30) {
      this.emitNoise(this.player.x + Phaser.Math.Between(-80, 80), this.player.y + Phaser.Math.Between(-80, 80), 220);
    }
  }

  private collectPickup(pickup: PickupData, sprite: Phaser.GameObjects.GameObject) {
    if (pickup.requires && !this.inventory.has(pickup.requires)) {
      this.broadcast('The drawer is locked. Something in the motel office belongs here.');
      return;
    }
    if (pickup.afterFuseCount && this.fuseCount < pickup.afterFuseCount) {
      this.broadcast('The air is too still. This has not happened yet.');
      return;
    }

    this.collected.add(pickup.id);
    sprite.destroy();
    if (pickup.kind === 'battery') {
      this.battery = Phaser.Math.Clamp(this.battery + 42, 0, 100);
    } else if (pickup.kind === 'health_item') {
      this.health = Phaser.Math.Clamp(this.health + 1, 0, 3);
    } else if (pickup.kind === 'fuse') {
      this.events.emit(EVENTS.FUSE_COLLECTED);
    } else {
      this.inventory.add(pickup.kind);
      if (pickup.kind === 'flashlight') {
        this.objective = 'Search the diner and motel for municipal fuses.';
      }
    }
    this.broadcast(`Picked up ${pickup.label}.`);
  }

  private readNote(note: NoteData) {
    this.readNotes.add(note.id);
    this.broadcast(`${note.title}\n${note.body}`, 5200);
    if (note.id === 'ledger' && !this.collected.has('clinic-key')) {
      this.objective = 'Take the clinic key from the motel office, then enter the clinic.';
    }
  }

  private tryOpenDoor(door: DoorData) {
    if (door.kind === 'clinic' && !this.inventory.has('clinic_key')) {
      this.broadcast('The clinic door is locked. The motel ledger mentions a returned key.');
      return;
    }
    if (door.kind === 'basement' && this.fuseCount < 3) {
      this.broadcast('The basement stairwell has no power. Three municipal fuses are missing.');
      return;
    }
    if (door.kind === 'exit' && !this.finalSequence) {
      this.broadcast('The service tunnel gate is dead. Restore power in the fuse room.');
      return;
    }
    this.unlockDoor(door.id);
    if (door.kind === 'basement') {
      this.objective = 'Reach the service tunnel gate before the broadcast finishes.';
      this.startFinalSequence();
    }
    if (door.kind === 'exit') {
      this.completeChapter();
    }
  }

  private unlockDoor(doorId: string) {
    this.collected.add(doorId);
    for (const child of this.doorWalls.getChildren()) {
      if (child.getData('doorId') === doorId) {
        child.destroy();
      }
    }
    this.broadcast('The lock gives with a sound like teeth.');
  }

  private textureForPickup(kind: ItemKind) {
    if (kind === 'battery') return 'battery';
    if (kind === 'fuse') return 'fuse';
    if (kind === 'clinic_key') return 'key';
    if (kind === 'health_item') return 'health';
    return 'battery';
  }

  private wakeEnemy(state: EnemyState) {
    this.enemyState = state;
    this.enemy.setVisible(true);
    this.enemy.setPosition(1330, 1190);
  }

  private shiftRooms() {
    if (this.shifted) {
      return;
    }
    this.shifted = true;
    this.events.emit(EVENTS.ROOM_SHIFTED);
    this.cameras.main.shake(550, 0.012);
    this.cameras.main.flash(500, 150, 40, 35, false);
    this.broadcast('The town inhales. Wallpaper darkens. Every hallway feels below ground.', 4600);
    this.horrorLayer.removeAll(true);
    for (const room of ROOMS.filter((room) => room.shiftedColor)) {
      const stain = this.add.rectangle(room.x, room.y, room.width - 20, room.height - 20, room.shiftedColor!, 0.55).setDepth(3);
      const lines = this.add.graphics().setDepth(4);
      lines.lineStyle(2, 0x5b312d, 0.35);
      for (let x = room.x - room.width / 2 + 30; x < room.x + room.width / 2; x += 48) {
        lines.lineBetween(x, room.y - room.height / 2 + 20, x + 80, room.y + room.height / 2 - 20);
      }
      this.horrorLayer.add([stain, lines]);
    }
  }

  private emitNoise(x: number, y: number, radius: number) {
    this.events.emit(EVENTS.NOISE_EMITTED, { x, y, radius });
    const marker = this.add.circle(x, y, 8, 0xa74337, 0.22).setDepth(45);
    this.tweens.add({ targets: marker, radius, alpha: 0, duration: 650, ease: 'Sine.easeOut' });
    this.noiseMarkers.push(marker);
    if (this.enemyState !== 'dormant') {
      const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, x, y);
      if (distance < radius + 350 && this.enemyState !== 'chase' && this.enemyState !== 'stunned') {
        this.enemyState = 'investigate';
        this.enemyTarget.set(x, y);
      }
    }
  }

  private tryStunEnemy() {
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.enemy.x, this.enemy.y);
    if (this.enemyState !== 'dormant' && distance < 170 && this.isPointInFlashlight(this.enemy.x, this.enemy.y)) {
      this.enemyState = 'stunned';
      this.stunnedUntil = this.time.now + 1450;
      this.battery = Phaser.Math.Clamp(this.battery - 18, 0, 100);
      this.broadcast('The attendant folds away from the light.');
      return;
    }
    this.battery = Phaser.Math.Clamp(this.battery - 6, 0, 100);
    this.broadcast('The beam catches only ash.');
  }

  private damagePlayer() {
    this.health -= 1;
    this.cameras.main.shake(240, 0.016);
    this.cameras.main.flash(180, 130, 20, 20, false);
    if (this.health <= 0) {
      this.state = 'dead';
      this.events.emit(EVENTS.PLAYER_DIED);
      this.player.setVelocity(0, 0);
      this.enemy.setVelocity(0, 0);
      this.centerText.setText('THE BROADCAST ENDS\n\nYou were found in the intake hall.\n\nPress R to restart');
      this.centerText.setVisible(true);
    }
  }

  private startFinalSequence() {
    this.finalSequence = true;
    this.enemyState = 'chase';
    this.enemyTarget.set(this.player.x, this.player.y);
    this.unlockDoor('exit-door');
    this.broadcast('Every speaker in the clinic whispers your name. Run.', 4200);
  }

  private completeChapter() {
    this.state = 'chapter_complete';
    this.events.emit(EVENTS.CHAPTER_COMPLETED);
    this.player.setVelocity(0, 0);
    this.enemy.setVelocity(0, 0);
    this.centerText.setText('CHAPTER COMPLETE\n\nThe service tunnel opens into deeper fog.\nThe radio says: "You came back early."\n\nPress R to play again');
    this.centerText.setVisible(true);
  }

  private broadcast(text: string, duration = 3200) {
    this.messageText.setText(text);
    this.messageText.setVisible(true);
    this.messageUntil = this.time.now + duration;
  }

  private drawFlashlight() {
    this.flashlight.clear();
    if (!this.inventory.has('flashlight') || this.battery <= 0) {
      return;
    }
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    const range = 280 + this.battery * 1.6;
    const spread = Phaser.Math.DegToRad(24);
    const p1 = new Phaser.Math.Vector2(this.player.x, this.player.y);
    const p2 = new Phaser.Math.Vector2(this.player.x + Math.cos(angle - spread) * range, this.player.y + Math.sin(angle - spread) * range);
    const p3 = new Phaser.Math.Vector2(this.player.x + Math.cos(angle + spread) * range, this.player.y + Math.sin(angle + spread) * range);
    this.flashlight.fillStyle(0xe8dfb8, 0.12).fillTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    this.flashlight.lineStyle(2, 0xe8dfb8, 0.18).strokeTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  }

  private drawFog() {
    const camera = this.cameras.main;
    const x = camera.scrollX;
    const y = camera.scrollY;
    this.fog.clear();
    this.fog.fillStyle(0x070807, 0.42).fillRect(x, y, camera.width, camera.height);
    for (let i = 0; i < 26; i += 1) {
      const px = x + ((i * 157 + this.fogDrift * 9000) % (camera.width + 260)) - 130;
      const py = y + ((i * 89 + Math.sin(this.fogDrift * 8 + i) * 70) % (camera.height + 160)) - 80;
      this.fog.fillStyle(i % 2 === 0 ? 0xb9bca8 : 0x7f8476, this.shifted ? 0.075 : 0.105);
      this.fog.fillEllipse(px, py, 340 + (i % 5) * 55, 80 + (i % 3) * 28);
    }
    const darkness = this.inventory.has('flashlight') ? 0.16 : 0.34;
    this.fog.fillStyle(0x000000, darkness).fillRect(x, y, camera.width, camera.height);
  }

  private isPointInFlashlight(x: number, y: number) {
    if (!this.inventory.has('flashlight') || this.battery <= 0) {
      return false;
    }
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const facing = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    const target = Phaser.Math.Angle.Between(this.player.x, this.player.y, x, y);
    const diff = Math.abs(Phaser.Math.Angle.Wrap(target - facing));
    return diff < Phaser.Math.DegToRad(28);
  }
}

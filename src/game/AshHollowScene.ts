import Phaser from 'phaser';
import { GAME_CONFIG } from './config';
import { FLAT_ASSET_CREDITS, VENDOR_ASSET_KEYS, VENDOR_ASSET_PATHS } from './data/assetManifest';
import { DOORS, NOTES, PATROL_POINTS, PICKUPS, ROOMS, WALLS, WORLD_SIZE } from './data/levelData';
import { EVENTS } from './events';
import { ProceduralAudioController } from './systems/AudioController';
import type { DoorData, EnemyState, GameState, Interactable, ItemKind, NoteData, PickupData } from './types';

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
  private ash!: Phaser.GameObjects.Graphics;
  private uiText!: Phaser.GameObjects.Text;
  private centerText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private promptIcon!: Phaser.GameObjects.Sprite;
  private messageText!: Phaser.GameObjects.Text;
  private staticText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private creditText!: Phaser.GameObjects.Text;
  private menuPromptIcons: Phaser.GameObjects.Sprite[] = [];
  private muteKey!: Phaser.Input.Keyboard.Key;
  private volumeDownKey!: Phaser.Input.Keyboard.Key;
  private volumeUpKey!: Phaser.Input.Keyboard.Key;
  private creditsKey!: Phaser.Input.Keyboard.Key;
  private interactionTarget?: Interactable;
  private interactables: Interactable[] = [];
  private inventory = new Set<ItemKind>();
  private collected = new Set<string>();
  private readNotes = new Set<string>();
  private fuseCount = 0;
  private health = GAME_CONFIG.startingHealth;
  private battery = GAME_CONFIG.startingBattery;
  private objective = 'Find a light in the road fog.';
  private shifted = false;
  private finalSequence = false;
  private previousState: GameState = 'menu';
  private enemyState: EnemyState = 'dormant';
  private enemyTarget = new Phaser.Math.Vector2();
  private patrolIndex = 0;
  private searchUntil = 0;
  private stunnedUntil = 0;
  private lastDamageAt = 0;
  private nextFlickerAt = 0;
  private fogDrift = 0;
  private messageUntil = 0;
  private lastStepAt = 0;
  private lastThreatCueAt = 0;
  private enemyFrameTick = 0;
  private noiseMarkers: Phaser.GameObjects.Arc[] = [];
  private audio = new ProceduralAudioController(GAME_CONFIG.audioEnabled);

  constructor() {
    super('ash-hollow');
  }

  preload() {
    this.load.image(VENDOR_ASSET_KEYS.floorMetal, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.floorMetal]);
    this.load.image(VENDOR_ASSET_KEYS.floorStone, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.floorStone]);
    this.load.image(VENDOR_ASSET_KEYS.floorWood, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.floorWood]);
    this.load.image(VENDOR_ASSET_KEYS.wallConcrete, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.wallConcrete]);
    this.load.image(VENDOR_ASSET_KEYS.wallMetal, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.wallMetal]);
    this.load.image(VENDOR_ASSET_KEYS.grungeTiles, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.grungeTiles]);
    this.load.spritesheet(VENDOR_ASSET_KEYS.inputPrompts, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.inputPrompts], {
      frameWidth: 16,
      frameHeight: 16,
      spacing: 1
    });
    this.load.image(VENDOR_ASSET_KEYS.enemyIdle, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.enemyIdle]);
    this.load.image(VENDOR_ASSET_KEYS.enemyMove0, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.enemyMove0]);
    this.load.image(VENDOR_ASSET_KEYS.enemyMove1, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.enemyMove1]);
    this.load.image(VENDOR_ASSET_KEYS.enemyMove2, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.enemyMove2]);
    this.load.image(VENDOR_ASSET_KEYS.enemyMove3, VENDOR_ASSET_PATHS[VENDOR_ASSET_KEYS.enemyMove3]);
    this.audio.preload(this);
    this.createGeneratedTextures();
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_SIZE.width, WORLD_SIZE.height);
    this.cameras.main.setBounds(0, 0, WORLD_SIZE.width, WORLD_SIZE.height);
    this.cameras.main.setBackgroundColor('#090b09');
    this.input.setDefaultCursor('crosshair');

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,F,SHIFT,SPACE,ESC,ENTER,R,ONE,TWO,THREE,K') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.muteKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.volumeDownKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA);
    this.volumeUpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
    this.creditsKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.input.on('pointerdown', () => {
      if (this.state === 'menu') {
        this.startGame();
      }
    });

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
    if (Phaser.Input.Keyboard.JustDown(this.creditsKey) && (this.state === 'menu' || this.state === 'paused')) {
      this.showCredits();
      return;
    }
    if ((Phaser.Input.Keyboard.JustDown(this.keys.ESC) || Phaser.Input.Keyboard.JustDown(this.creditsKey)) && this.state === 'credits') {
      this.hideCredits();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.R) && (this.state === 'dead' || this.state === 'chapter_complete')) {
      this.restartScene();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) && this.state === 'playing') {
      this.state = 'paused';
      this.centerText.setText(
        `PAUSED\n\nEsc resumes\nC opens credits\nM toggles audio\n, and . adjust volume\n\nAudio: ${this.audio.isMuted() ? 'muted' : `${Math.round(this.audio.getVolume() * 100)}%`}`
      );
      this.centerText.setVisible(true);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) && this.state === 'paused') {
      this.state = 'playing';
      this.centerText.setVisible(false);
    }
    if (this.state === 'paused') {
      this.updateAudioControls();
      return;
    }
    if (this.state !== 'playing') {
      return;
    }

    this.updateAudioControls();
    this.updateDebugShortcuts();
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
    this.add.rectangle(WORLD_SIZE.width / 2, WORLD_SIZE.height / 2, WORLD_SIZE.width, WORLD_SIZE.height, 0x0b0d0a).setDepth(-20);

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
      this.mapLayer.add([shadow, floor]);
      this.addVendorRoomDressing(room);
      this.addRoomDressing(room);
      this.mapLayer.add(label);
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

  private addRoomDressing(room: (typeof ROOMS)[number]) {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x4a4d42, 0.18);
    for (let x = room.x - room.width / 2 + 34; x < room.x + room.width / 2; x += 68) {
      graphics.lineBetween(x, room.y - room.height / 2 + 28, x + 24, room.y + room.height / 2 - 30);
    }
    graphics.fillStyle(0x0a0b09, 0.34);
    graphics.fillRect(room.x - room.width / 2 + 18, room.y + room.height / 2 - 42, room.width - 36, 12);
    this.mapLayer.add(graphics);
  }

  private addVendorRoomDressing(room: (typeof ROOMS)[number]) {
    const floorKeyByRoom: Record<string, string> = {
      road: VENDOR_ASSET_KEYS.floorStone,
      diner: VENDOR_ASSET_KEYS.floorWood,
      motel: VENDOR_ASSET_KEYS.floorWood,
      clinic: VENDOR_ASSET_KEYS.floorMetal,
      storage: VENDOR_ASSET_KEYS.floorMetal,
      fuse: VENDOR_ASSET_KEYS.floorMetal,
      basement: VENDOR_ASSET_KEYS.floorStone,
      tunnel: VENDOR_ASSET_KEYS.floorStone
    };
    const floor = this.add.tileSprite(room.x, room.y, room.width - 28, room.height - 28, floorKeyByRoom[room.id] ?? VENDOR_ASSET_KEYS.floorStone);
    floor.setAlpha(room.id === 'road' ? 0.18 : 0.26);
    floor.setTint(room.shiftedColor ? 0x9f9182 : 0x8a8d82);
    this.mapLayer.add(floor);

    const wallKey = room.id === 'clinic' || room.id === 'storage' || room.id === 'fuse' ? VENDOR_ASSET_KEYS.wallMetal : VENDOR_ASSET_KEYS.wallConcrete;
    const topWall = this.add.tileSprite(room.x, room.y - room.height / 2 + 10, room.width - 18, 20, wallKey);
    const bottomWall = this.add.tileSprite(room.x, room.y + room.height / 2 - 10, room.width - 18, 20, wallKey);
    topWall.setAlpha(0.24).setTint(0x7b7568);
    bottomWall.setAlpha(0.18).setTint(0x5f5a51);
    this.mapLayer.add([topWall, bottomWall]);

    const grime = this.add.sprite(room.x + room.width * 0.18, room.y + room.height * 0.12, VENDOR_ASSET_KEYS.grungeTiles);
    grime.setDisplaySize(Math.min(room.width * 0.62, 360), Math.min(room.height * 0.58, 260));
    grime.setAlpha(room.id === 'basement' || room.id === 'storage' ? 0.19 : 0.1);
    grime.setTint(room.shiftedColor ? 0x8b3830 : 0x71695d);
    this.mapLayer.add(grime);
  }

  private createActors() {
    this.player = this.physics.add.sprite(230, 820, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body!.setSize(20, 22).setOffset(6, 8);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.doorWalls);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.enemy = this.physics.add.sprite(1350, 1190, VENDOR_ASSET_KEYS.enemyIdle);
    this.enemy.setDepth(19);
    this.enemy.setVisible(false);
    this.enemy.setDisplaySize(46, 54);
    this.enemy.setTint(0x6f514d);
    this.enemy.body!.setSize(20, 28).setOffset(8, 10);
    this.physics.add.collider(this.enemy, this.walls);
    this.physics.add.collider(this.enemy, this.doorWalls);

    this.flashlight = this.add.graphics().setDepth(40);
    this.ash = this.add.graphics().setDepth(46);
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

    this.statusText = this.add.text(1260, 16, '', {
      fontSize: '13px',
      color: '#a7aa98',
      fontFamily: 'monospace',
      align: 'right'
    });
    this.statusText.setOrigin(1, 0).setScrollFactor(0).setDepth(80);

    this.promptText = this.add.text(640, 650, '', {
      fontSize: '18px',
      color: '#efe6ca',
      backgroundColor: '#10110dee',
      padding: { x: 14, y: 8 },
      fontFamily: 'monospace'
    });
    this.promptText.setOrigin(0.5).setScrollFactor(0).setDepth(90).setVisible(false);

    this.promptIcon = this.add.sprite(544, 650, VENDOR_ASSET_KEYS.inputPrompts, 600);
    this.promptIcon.setScale(2).setScrollFactor(0).setDepth(91).setVisible(false);

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

    this.creditText = this.add.text(640, 360, '', {
      fontSize: '15px',
      color: '#ddd5c3',
      fontFamily: 'monospace',
      align: 'left',
      backgroundColor: '#070806f2',
      padding: { x: 24, y: 20 },
      wordWrap: { width: 920 },
      lineSpacing: 5
    });
    this.creditText.setOrigin(0.5).setScrollFactor(0).setDepth(110).setVisible(false);
  }

  private registerEvents() {
    this.events.on(EVENTS.FUSE_COLLECTED, () => {
      this.fuseCount += 1;
      this.emitNoise(this.player.x, this.player.y, 260);
      this.audio.playCue('pickup');
      if (this.fuseCount === 1) {
        this.objective = 'Follow the road west to the motel. Read the ledger and take the clinic key.';
        this.broadcast('The radio coughs: "First circuit awake. The attendant has your chart."');
        this.wakeEnemy('patrol');
      }
      if (this.fuseCount === 2) {
        this.objective = 'Enter the clinic. The final fuse is in pharmacy storage.';
        this.shiftRooms();
      }
      if (this.fuseCount === 3) {
        this.objective = 'All fuses found. Return to the municipal fuse room, then reach the basement.';
        this.broadcast('A PA speaker clicks on somewhere below you: "Basement intake is ready."');
      }
    });
  }

  private showMenu() {
    this.state = 'menu';
    this.centerText.setText(
      'ASH HOLLOW v0.3\n\nA fully AI-created 2.5D psychological horror demo\n\nWASD / Arrows move\nShift sprints and makes noise\nMouse aims flashlight\nE interacts\nF stuns nearby threat if flashlight is charged\nM toggles audio\n, and . adjust volume\nC opens credits\n\nPress Enter or click'
    );
    this.centerText.setVisible(true);
    this.addMenuPromptIcons();
    this.uiText.setText('');
  }

  private startGame() {
    this.state = 'playing';
    this.centerText.setVisible(false);
    this.creditText.setVisible(false);
    this.clearMenuPromptIcons();
    this.audio.startAmbience('dungeon');
    this.events.emit(EVENTS.OBJECTIVE_STARTED, 'chapter');
    this.broadcast('Ash falls sideways. Find the cracked flashlight, then search the diner and motel for fuses.');
  }

  private restartScene() {
    this.audio.setThreatLevel(0);
    this.audio.stopAmbience();
    this.scene.restart();
  }

  private showCredits() {
    this.previousState = this.state;
    this.state = 'credits';
    this.centerText.setVisible(false);
    const assetLines = FLAT_ASSET_CREDITS.map(
      (credit) => `- ${credit.title} by ${credit.creator} (${credit.license})\n  ${credit.usage}${credit.modified ? ' Modified/tinted/scaled in-game.' : ''}`
    );
    this.creditText.setText(
      [
        'CREDITS AND TRANSPARENCY',
        '',
        'AI / HUMAN WORK',
        '- OpenAI Codex / ChatGPT: concept, planning, implementation, docs, checks, repository and deployment support.',
        '- Claude Code with Claude Opus 4.7: planned future review/debugging collaborator.',
        '- Human direction: tone, approval, taste, priorities, and iteration requests.',
        '',
        'THIRD-PARTY ASSETS',
        ...assetLines,
        '',
        'All third-party assets currently integrated are CC0. Attribution is included voluntarily for transparency.',
        '',
        'Press Esc or C to return.'
      ].join('\n')
    );
    this.creditText.setVisible(true);
  }

  private hideCredits() {
    this.creditText.setVisible(false);
    this.state = this.previousState === 'credits' ? 'menu' : this.previousState;
    if (this.state === 'menu' || this.state === 'paused') {
      this.centerText.setVisible(true);
    }
  }

  private addMenuPromptIcons() {
    this.clearMenuPromptIcons();
    const y = 526;
    for (let i = 0; i < 5; i += 1) {
      const icon = this.add.sprite(540 + i * 36, y, VENDOR_ASSET_KEYS.inputPrompts, 590 + i);
      icon.setScale(2).setScrollFactor(0).setDepth(101).setAlpha(0.55);
      this.tweens.add({ targets: icon, alpha: 0.2, duration: 1600, yoyo: true, repeat: -1, delay: i * 110 });
      this.menuPromptIcons.push(icon);
    }
  }

  private clearMenuPromptIcons() {
    this.menuPromptIcons.forEach((icon) => icon.destroy());
    this.menuPromptIcons = [];
  }

  private updateAudioControls() {
    if (Phaser.Input.Keyboard.JustDown(this.muteKey)) {
      this.audio.setMuted(!this.audio.isMuted());
      this.broadcast(`Audio ${this.audio.isMuted() ? 'muted' : 'enabled'}.`, 1500);
      if (this.state === 'paused') {
        this.centerText.setText(
          `PAUSED\n\nEsc resumes\nC opens credits\nM toggles audio\n, and . adjust volume\n\nAudio: ${this.audio.isMuted() ? 'muted' : `${Math.round(this.audio.getVolume() * 100)}%`}`
        );
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.volumeDownKey)) {
      this.audio.setVolume(this.audio.getVolume() - 0.1);
      this.audio.setMuted(false);
      this.broadcast(`Audio volume ${Math.round(this.audio.getVolume() * 100)}%.`, 1500);
    }
    if (Phaser.Input.Keyboard.JustDown(this.volumeUpKey)) {
      this.audio.setVolume(this.audio.getVolume() + 0.1);
      this.audio.setMuted(false);
      this.broadcast(`Audio volume ${Math.round(this.audio.getVolume() * 100)}%.`, 1500);
    }
  }

  private updateDebugShortcuts() {
    if (!GAME_CONFIG.debugShortcutsEnabled) {
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
      this.player.setPosition(720, 300);
      this.broadcast('[dev] Jumped to motel.');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
      this.player.setPosition(1230, 330);
      this.inventory.add('clinic_key');
      this.broadcast('[dev] Jumped to clinic with key.');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) {
      this.fuseCount = 3;
      this.inventory.add('flashlight');
      this.inventory.add('clinic_key');
      this.unlockDoor('clinic-door', false);
      this.broadcast('[dev] Fuses completed.');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
      this.damagePlayer();
    }
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
    if (axis.lengthSq() > 0) {
      this.player.setRotation(Math.atan2(axis.y, axis.x));
    }
    if (axis.lengthSq() > 0 && this.time.now - this.lastStepAt > (sprinting ? 260 : 430)) {
      this.lastStepAt = this.time.now;
      this.audio.playCue('step');
    }
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
      this.audio.playCue('note');
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
    this.promptIcon.setVisible(Boolean(closest));
    if (closest) {
      this.promptText.setText(`     ${closest.label}`);
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
      const patrolPoint = PATROL_POINTS[this.patrolIndex];
      this.enemyTarget.set(patrolPoint.x, patrolPoint.y);
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
      if (distanceToPlayer > 560) {
        this.enemyState = 'search';
        this.searchUntil = time + 3000;
      }
      if (distanceToPlayer < 32 && time - this.lastDamageAt > 1550) {
        this.damagePlayer();
        this.lastDamageAt = time;
      }
    }

    const speedByState: Record<EnemyState, number> = {
      dormant: 0,
      patrol: 76 + this.fuseCount * 8,
      investigate: 108 + this.fuseCount * 9,
      chase: 150 + this.fuseCount * 13,
      search: 68,
      stunned: 0
    };
    this.physics.moveToObject(this.enemy, this.enemyTarget, speedByState[this.enemyState], delta);
    this.updateEnemySprite(delta);
  }

  private updateEnemySprite(delta: number) {
    this.enemyFrameTick += delta;
    if (this.enemyState === 'stunned') {
      this.enemy.setTexture(VENDOR_ASSET_KEYS.enemyIdle).setTint(0xb99f82);
      this.enemy.setDisplaySize(48, 50);
      return;
    }
    const movingFrames = [
      VENDOR_ASSET_KEYS.enemyMove0,
      VENDOR_ASSET_KEYS.enemyMove1,
      VENDOR_ASSET_KEYS.enemyMove2,
      VENDOR_ASSET_KEYS.enemyMove3
    ];
    const frame = this.enemyState === 'dormant' || this.enemyState === 'patrol'
      ? VENDOR_ASSET_KEYS.enemyIdle
      : movingFrames[Math.floor(this.enemyFrameTick / 180) % movingFrames.length];
    this.enemy.setTexture(frame).setTint(this.enemyState === 'chase' ? 0x9d5c52 : 0x6f514d);
    this.enemy.setDisplaySize(this.enemyState === 'chase' ? 52 : 46, this.enemyState === 'chase' ? 60 : 54);
  }

  private updateHorror(time: number, delta: number) {
    this.fogDrift += delta * 0.00018;
    this.drawFlashlight();
    this.drawAsh();
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
      this.audio.setThreatLevel(intensity);
      if (intensity > 0.55 && time - this.lastThreatCueAt > 1300) {
        this.lastThreatCueAt = time;
        this.audio.playCue('noise');
      }
    } else {
      this.audio.setThreatLevel(0);
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
        `Audio: ${this.audio.isMuted() ? 'muted' : `${Math.round(this.audio.getVolume() * 100)}%`}`,
        '',
        this.objective
      ].join('\n')
    );
    this.statusText.setText(
      [
        this.finalSequence ? 'RUN TO THE SERVICE TUNNEL' : 'PUBLIC DEMO v0.3',
        GAME_CONFIG.debugShortcutsEnabled ? 'DEV SHORTCUTS: 1 2 3 K' : '',
        'M mute  ,/. volume'
      ]
        .filter(Boolean)
        .join('\n')
    );

    if (this.finalSequence && time % 900 < 30) {
      this.emitNoise(this.player.x + Phaser.Math.Between(-80, 80), this.player.y + Phaser.Math.Between(-80, 80), 220);
    }
  }

  private collectPickup(pickup: PickupData, sprite: Phaser.GameObjects.GameObject) {
    if (pickup.requires && !this.inventory.has(pickup.requires)) {
      this.audio.playCue('locked');
      this.broadcast('Locked. Read the motel ledger, then take the clinic key from the office.');
      return;
    }
    if (pickup.afterFuseCount && this.fuseCount < pickup.afterFuseCount) {
      this.audio.playCue('locked');
      this.broadcast('The air is too still. This has not happened yet.');
      return;
    }

    this.collected.add(pickup.id);
    sprite.destroy();
    this.audio.playCue('pickup');
    if (pickup.kind === 'battery') {
      this.battery = Phaser.Math.Clamp(this.battery + 42, 0, 100);
    } else if (pickup.kind === 'health_item') {
      this.health = Phaser.Math.Clamp(this.health + 1, 0, 3);
    } else if (pickup.kind === 'fuse') {
      this.events.emit(EVENTS.FUSE_COLLECTED);
    } else {
      this.inventory.add(pickup.kind);
      if (pickup.kind === 'flashlight') {
        this.objective = 'Search the diner first. Then follow the road west to the motel office.';
      }
    }
    this.broadcast(`Picked up ${pickup.label}.`);
  }

  private readNote(note: NoteData) {
    this.readNotes.add(note.id);
    this.audio.playCue('note');
    this.broadcast(`${note.title}\n${note.body}`, 5200);
    if (note.id === 'ledger' && !this.collected.has('clinic-key')) {
      this.objective = 'Take the clinic key from the motel office, then enter the clinic.';
    }
  }

  private tryOpenDoor(door: DoorData) {
    if (door.kind === 'clinic' && !this.inventory.has('clinic_key')) {
      this.audio.playCue('locked');
      this.broadcast('The clinic door is locked. The motel ledger points to the returned key.');
      return;
    }
    if (door.kind === 'basement' && this.fuseCount < 3) {
      this.audio.playCue('locked');
      this.broadcast(`The basement stairwell has no power. ${3 - this.fuseCount} municipal fuse${3 - this.fuseCount === 1 ? '' : 's'} still missing.`);
      return;
    }
    if (door.kind === 'exit' && !this.finalSequence) {
      this.audio.playCue('locked');
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

  private unlockDoor(doorId: string, announce = true) {
    this.collected.add(doorId);
    for (const child of this.doorWalls.getChildren()) {
      if (child.getData('doorId') === doorId) {
        child.destroy();
      }
    }
    this.audio.playCue('door');
    if (announce) {
      this.broadcast('The lock gives with a sound like teeth.');
    }
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
    this.audio.playCue('shift');
    this.audio.playAssetCue('shift');
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
    this.audio.playCue('noise');
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
      this.audio.playCue('stun');
      this.broadcast('The attendant folds away from the light.');
      return;
    }
    this.battery = Phaser.Math.Clamp(this.battery - 6, 0, 100);
    this.audio.playCue('locked');
    this.broadcast('The beam catches only ash.');
  }

  private damagePlayer() {
    this.health -= 1;
    this.audio.playCue('hurt');
    this.cameras.main.shake(240, 0.016);
    this.cameras.main.flash(180, 130, 20, 20, false);
    if (this.health <= 0) {
      this.state = 'dead';
      this.events.emit(EVENTS.PLAYER_DIED);
      this.audio.playCue('death');
      this.audio.playAssetCue('death');
      this.audio.setThreatLevel(0);
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
    this.audio.playCue('shift');
    this.audio.playAssetCue('final');
    this.broadcast('Every speaker in the clinic whispers your name. Run.', 4200);
  }

  private completeChapter() {
    this.state = 'chapter_complete';
    this.events.emit(EVENTS.CHAPTER_COMPLETED);
    this.audio.playCue('complete');
    this.audio.setThreatLevel(0);
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
    this.flashlight.fillStyle(0xf1e7bd, 0.18).fillTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    this.flashlight.fillStyle(0xf8edc9, 0.08).fillCircle(this.player.x, this.player.y, 72);
    this.flashlight.lineStyle(2, 0xf1e7bd, 0.26).strokeTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  }

  private drawAsh() {
    const camera = this.cameras.main;
    const x = camera.scrollX;
    const y = camera.scrollY;
    this.ash.clear();
    this.ash.fillStyle(this.shifted ? 0x9f766c : 0xd4d0bb, this.finalSequence ? 0.42 : 0.26);
    for (let i = 0; i < 90; i += 1) {
      const px = x + ((i * 73 + this.fogDrift * 32000) % (camera.width + 90)) - 45;
      const py = y + ((i * 41 + this.fogDrift * 18000) % (camera.height + 70)) - 35;
      this.ash.fillRect(px, py, 2 + (i % 3), 1 + (i % 2));
    }
  }

  private drawFog() {
    const camera = this.cameras.main;
    const x = camera.scrollX;
    const y = camera.scrollY;
    this.fog.clear();
    this.fog.fillStyle(0x070807, this.finalSequence ? 0.52 : 0.42).fillRect(x, y, camera.width, camera.height);
    for (let i = 0; i < 34; i += 1) {
      const px = x + ((i * 157 + this.fogDrift * 9000) % (camera.width + 260)) - 130;
      const py = y + ((i * 89 + Math.sin(this.fogDrift * 8 + i) * 70) % (camera.height + 160)) - 80;
      this.fog.fillStyle(i % 2 === 0 ? 0xb9bca8 : 0x7f8476, this.shifted ? 0.095 : 0.115);
      this.fog.fillEllipse(px, py, 340 + (i % 5) * 55, 80 + (i % 3) * 28);
    }
    const darkness = this.inventory.has('flashlight') ? 0.13 : 0.34;
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

import Phaser from 'phaser';
import type { EnemyAlertReason, EnemyConfig, EnemyRuntimeState, EnemyState, PatrolPoint } from '../types';

export interface EnemyUpdateContext {
  time: number;
  delta: number;
  player: Phaser.Physics.Arcade.Sprite;
  fuseCount: number;
  shifted: boolean;
  flashlightActive: boolean;
  isEnemyInFlashlight: () => boolean;
}

export interface EnemyUpdateResult {
  state: EnemyState;
  alertReason: EnemyAlertReason;
  distanceToPlayer: number;
  threatLevel: number;
  damagedPlayer: boolean;
}

export class EnemyController {
  private runtime: EnemyRuntimeState = {
    state: 'dormant',
    target: new Phaser.Math.Vector2(),
    lastKnownPlayerPosition: new Phaser.Math.Vector2(),
    alertReason: 'none',
    patrolIndex: 0,
    searchUntil: 0,
    stunnedUntil: 0,
    lastSeenAt: 0,
    lastDamageAt: 0
  };
  private lastAnnouncedAlert: EnemyAlertReason = 'none';

  constructor(
    private readonly enemy: Phaser.Physics.Arcade.Sprite,
    private readonly patrolPoints: PatrolPoint[],
    private readonly config: EnemyConfig,
    private readonly onAlert: (reason: EnemyAlertReason) => void
  ) {}

  wake(state: EnemyState, playerPosition?: Phaser.Math.Vector2) {
    this.transitionTo(state, 'none');
    if (playerPosition && Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, playerPosition.x, playerPosition.y) < this.config.minSpawnDistance) {
      this.enemy.setPosition(1330, 1190);
    }
    this.enemy.setVisible(true);
    this.runtime.target.copy(this.currentPatrolPoint());
  }

  getState() {
    return this.runtime.state;
  }

  getRuntimeState(): EnemyRuntimeState {
    return {
      ...this.runtime,
      target: this.runtime.target.clone(),
      lastKnownPlayerPosition: this.runtime.lastKnownPlayerPosition.clone()
    };
  }

  hearNoise(x: number, y: number, radius: number) {
    if (this.runtime.state === 'dormant' || this.runtime.state === 'chase' || this.runtime.state === 'stunned') {
      return;
    }
    const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, x, y);
    if (distance > radius + this.config.noiseInvestigatePadding) {
      return;
    }
    this.runtime.target.set(x, y);
    this.runtime.lastKnownPlayerPosition.set(x, y);
    this.runtime.searchUntil = 0;
    this.transitionTo('investigate', 'noise');
  }

  stun(time: number) {
    if (this.runtime.state === 'dormant') {
      return;
    }
    this.runtime.stunnedUntil = time + this.config.stunDuration;
    this.transitionTo('stunned', 'damage');
    this.enemy.setVelocity(0, 0);
  }

  update(context: EnemyUpdateContext): EnemyUpdateResult {
    if (this.runtime.state === 'dormant') {
      this.enemy.setVelocity(0, 0);
      return this.result(context, 0, false);
    }

    const distanceToPlayer = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, context.player.x, context.player.y);
    const sightReason = this.detectPlayer(context, distanceToPlayer);
    if (sightReason) {
      this.runtime.lastKnownPlayerPosition.set(context.player.x, context.player.y);
      this.runtime.lastSeenAt = context.time;
      this.transitionTo('chase', sightReason);
    }

    if (this.runtime.state === 'stunned') {
      if (context.time >= this.runtime.stunnedUntil) {
        this.runtime.searchUntil = context.time + this.config.searchDuration;
        this.runtime.target.copy(this.runtime.lastKnownPlayerPosition);
        this.transitionTo('search', 'none');
      } else {
        this.enemy.setVelocity(0, 0);
        return this.result(context, distanceToPlayer, false);
      }
    }

    if (this.runtime.state === 'patrol') {
      this.runtime.target.copy(this.currentPatrolPoint());
      if (Phaser.Math.Distance.BetweenPoints(this.enemy, this.runtime.target) < this.config.patrolArriveDistance) {
        this.runtime.patrolIndex = (this.runtime.patrolIndex + 1) % this.patrolPoints.length;
        this.runtime.target.copy(this.currentPatrolPoint());
      }
    }

    if (this.runtime.state === 'investigate' && Phaser.Math.Distance.BetweenPoints(this.enemy, this.runtime.target) < this.config.investigateArriveDistance) {
      this.runtime.searchUntil = context.time + this.config.searchDuration;
      this.transitionTo('search', 'none');
    }

    if (this.runtime.state === 'search') {
      if (context.time >= this.runtime.searchUntil) {
        this.transitionTo('patrol', 'none');
        this.runtime.target.copy(this.currentPatrolPoint());
      } else if (Math.random() < this.config.searchRetargetChance) {
        this.runtime.target.set(
          this.runtime.lastKnownPlayerPosition.x + Phaser.Math.Between(-150, 150),
          this.runtime.lastKnownPlayerPosition.y + Phaser.Math.Between(-130, 130)
        );
      }
    }

    let damagedPlayer = false;
    if (this.runtime.state === 'chase') {
      this.runtime.target.set(context.player.x, context.player.y);
      if (!sightReason && context.time - this.runtime.lastSeenAt > this.config.loseSightDelay) {
        this.runtime.searchUntil = context.time + this.config.chaseSearchDuration;
        this.runtime.target.copy(this.runtime.lastKnownPlayerPosition);
        this.transitionTo('search', 'none');
      }
      if (distanceToPlayer < this.config.damageRange && context.time - this.runtime.lastDamageAt > this.config.damageCooldown) {
        this.runtime.lastDamageAt = context.time;
        damagedPlayer = true;
      }
    }

    this.move(context.fuseCount);
    return this.result(context, distanceToPlayer, damagedPlayer);
  }

  private detectPlayer(context: EnemyUpdateContext, distanceToPlayer: number): EnemyAlertReason | undefined {
    if (this.runtime.state === 'stunned') {
      return undefined;
    }
    if (distanceToPlayer < this.config.proximityRange) {
      return 'sight';
    }
    if (context.flashlightActive && distanceToPlayer < this.config.flashlightRange && context.isEnemyInFlashlight()) {
      return 'flashlight';
    }
    const range = context.shifted ? this.config.shiftedVisionRange : this.config.visionRange;
    if (distanceToPlayer > range) {
      return undefined;
    }
    const facing = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y, this.runtime.target.x, this.runtime.target.y);
    const toPlayer = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y, context.player.x, context.player.y);
    const diff = Math.abs(Phaser.Math.Angle.Wrap(toPlayer - facing));
    return diff < Phaser.Math.DegToRad(this.config.visionConeDegrees / 2) ? 'sight' : undefined;
  }

  private transitionTo(state: EnemyState, reason: EnemyAlertReason) {
    const changed = this.runtime.state !== state || (reason !== 'none' && this.runtime.alertReason !== reason);
    this.runtime.state = state;
    this.runtime.alertReason = reason;
    if (changed && reason !== 'none' && reason !== this.lastAnnouncedAlert) {
      this.lastAnnouncedAlert = reason;
      this.onAlert(reason);
    }
  }

  private move(fuseCount: number) {
    const baseSpeed = this.config.speedByState[this.runtime.state];
    const fuseBonus = this.config.fuseSpeedBonus[this.runtime.state] ?? 0;
    this.enemy.scene.physics.moveToObject(this.enemy, this.runtime.target, baseSpeed + fuseCount * fuseBonus);
  }

  private currentPatrolPoint() {
    const point = this.patrolPoints[this.runtime.patrolIndex];
    return new Phaser.Math.Vector2(point.x, point.y);
  }

  private result(context: EnemyUpdateContext, distanceToPlayer: number, damagedPlayer: boolean): EnemyUpdateResult {
    return {
      state: this.runtime.state,
      alertReason: this.runtime.alertReason,
      distanceToPlayer,
      threatLevel: this.runtime.state === 'dormant' ? 0 : Phaser.Math.Clamp(1 - distanceToPlayer / 720, 0, 1),
      damagedPlayer
    };
  }
}

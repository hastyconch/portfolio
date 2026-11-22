// Vendored from the Billable. game source (src/entities/enemies/Enemy.ts and the Stapler from
// src/entities/enemies/types.ts). Trimmed: no shields, bosses or sound. Under reduced motion a hit
// skips the white flash.
import Phaser from 'phaser';
import type { Player } from './Player';
import { blocks, type Terrain } from '../levels/format';

/** What enemies may ask of the level they live in. */
export interface LevelApi {
  readonly player: Player;
  readonly reducedMotion: boolean;
  terrainAt(px: number, py: number): Terrain;
  dropHours(x: number, y: number, amount: number): void;
  poof(x: number, y: number, tint?: number): void;
}

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  hp: number;
  contactDamage = 1;
  /** Billable Hours dropped on death. */
  bounty = 3;
  /** Pogo can bounce off it. */
  bounceable = true;
  /** The swing id that last hit this enemy (one swing, one hit). */
  lastSwing = -1;
  dead = false;
  protected stunUntil = 0;
  protected readonly level: LevelApi;

  constructor(
    level: LevelApi,
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    hp: number,
  ) {
    super(scene, x, y, texture, 0);
    this.level = level;
    this.hp = hp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(5);
  }

  abstract tick(dtMs: number): void;

  /** Where attacks must land to do damage. Defaults to the whole body. */
  hurtbox(): Phaser.Geom.Rectangle {
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  get stunned() {
    return this.scene.time.now < this.stunUntil;
  }

  /** Apply a hit. Returns true if it connected. */
  takeHit(damage: number, fromX: number): boolean {
    if (this.dead) return false;
    this.hp -= damage;
    if (!this.level.reducedMotion) {
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(70, () => this.active && this.clearTint());
    }
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    this.stunUntil = this.scene.time.now + 250;
    const dir = this.x < fromX ? -1 : 1;
    this.body.setVelocityX(dir * 110);
    if (this.body.allowGravity) this.body.setVelocityY(-90);
    return true;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.level.poof(this.x, this.y);
    if (this.bounty > 0) this.level.dropHours(this.x, this.y - 4, this.bounty);
    this.emit('died', this);
    this.destroy();
  }
}

const GRAVITY = 900;

/** The Red Stapler: walks back and forth, turns at walls and ledges. */
export class Stapler extends Enemy {
  private dir: 1 | -1 = -1;
  private readonly speed = 30;

  constructor(level: LevelApi, scene: Phaser.Scene, x: number, y: number) {
    super(level, scene, x, y, 'stapler', 2);
    this.body.setSize(18, 8).setOffset(2, 5);
    this.body.setGravityY(GRAVITY);
    this.bounty = 4;
    this.play('stapler-walk');
  }

  tick() {
    if (this.stunned) return;
    const b = this.body;
    if (b.blocked.left) this.dir = 1;
    else if (b.blocked.right) this.dir = -1;
    else if (b.blocked.down) {
      const aheadX = this.dir > 0 ? b.right + 2 : b.left - 2;
      const below = this.level.terrainAt(aheadX, b.bottom + 4);
      if (!blocks(below) && below !== 'desk') this.dir = this.dir > 0 ? -1 : 1;
    }
    b.setVelocityX(this.dir * this.speed);
    this.setFlipX(this.dir < 0);
  }
}

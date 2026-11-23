// Vendored from the Billable. game source (src/entities/player/Player.ts). Trimmed to one class
// with a single swing: no ladders, specials, combos or sound. The forgiveness mechanics (coyote
// time, jump buffer, variable jump height, apex hang, corner correction) are unchanged. Under
// reduced motion the hurt blink becomes a steady half-fade; otherwise it blinks at 2.5 Hz
// (../core/blink.ts, WO-025).
import Phaser from 'phaser';
import { hurtAlpha } from '../core/blink';
import type { Controls } from '../core/input';
import { blocks, type Terrain } from '../levels/format';
import { F, type ClassStats } from './classes';

export type PlayerState = 'normal' | 'attack' | 'pogo' | 'hurt' | 'dead' | 'frozen';

/* Forgiveness tuning. These are what make jumps feel fair. */
/** You can still jump this long after walking off a ledge. */
const COYOTE_MS = 130;
/** A jump pressed this many frames before landing still happens. */
const JUMP_BUFFER_FRAMES = 9;
/** Rising into a ceiling corner by up to this many px nudges you around it. */
const CORNER_CORRECTION_PX = 6;
/** Near the top of a held jump, gravity is reduced so you hang briefly. */
const APEX_SPEED = 45;
const APEX_GRAVITY_SCALE = 0.5;

const HURT_MS = 380;
const INVULN_MS = 1300;

/** What the player needs from the level. */
export interface PlayerWorld {
  terrainAt(px: number, py: number): Terrain;
  readonly reducedMotion: boolean;
}

/**
 * Movement and state for the player, driven entirely by ClassStats.
 * Combat resolution (what the hitboxes touch) is done by the Room scene.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  readonly stats: ClassStats;
  readonly weapon: Phaser.GameObjects.Sprite;
  pstate: PlayerState = 'normal';
  facing: 1 | -1 = 1;
  /** Swing id; enemies remember the last swing that hit them so one swing = one hit. */
  swingId = 0;
  invulnUntil = 0;
  /** While now < dropUntil, desks don't collide (drop-through). */
  dropUntil = 0;

  private coyote = 0;
  private stateT = 0;
  private jumpCutDone = true;
  private readonly world: PlayerWorld;

  constructor(scene: Phaser.Scene, world: PlayerWorld, x: number, y: number, stats: ClassStats) {
    super(scene, x, y, stats.sprite, F.idle0);
    this.stats = stats;
    this.world = world;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(10, 20).setOffset(5, 3);
    this.body.setMaxVelocityY(stats.maxFall);
    this.setDepth(10);
    this.weapon = scene.add.sprite(x, y, `${stats.sprite}-fx`, 0).setVisible(false).setDepth(11);
  }

  get onGround() {
    return this.body.blocked.down;
  }

  get invulnerable() {
    return this.scene.time.now < this.invulnUntil || this.pstate === 'dead';
  }

  /** Damage dealt by whatever hitbox is live right now. */
  get hitDamage(): number {
    return this.stats.attack.damage;
  }

  /** Melee hitbox in world space, or null outside the active window. */
  attackBox(): Phaser.Geom.Rectangle | null {
    const b = this.body;
    const st = this.stats.attack;
    if (this.pstate !== 'attack') return null;
    if (this.stateT < st.windup || this.stateT > st.windup + st.active) return null;
    const x = this.facing > 0 ? b.right - 4 : b.left + 4 - st.reach;
    return new Phaser.Geom.Rectangle(
      x,
      b.top - 4 - (st.height > 20 ? st.height - 20 : 0),
      st.reach,
      st.height,
    );
  }

  /** Down-thrust hitbox below the feet; only live while falling. */
  pogoBox(): Phaser.Geom.Rectangle | null {
    if (this.pstate !== 'pogo' || this.body.velocity.y < 0) return null;
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.left - 1, b.bottom - 2, b.width + 2, 10);
  }

  /** Called by the level when the pogo hits something bounceable. */
  bounce(held: boolean) {
    this.body.setVelocityY(-(held ? this.stats.pogoBounceHeld : this.stats.pogoBounce));
    this.jumpCutDone = true;
  }

  /** Returns true if the hit landed. */
  hurt(amount: number, fromX: number): boolean {
    if (this.invulnerable || amount <= 0 || this.pstate === 'frozen') return false;
    const dir = this.x < fromX ? -1 : 1;
    const kb = 1 - this.stats.knockbackResist * 0.5;
    this.enter('hurt');
    this.body.setVelocity(dir * 140 * kb, -170 * kb);
    this.invulnUntil = this.scene.time.now + INVULN_MS;
    return true;
  }

  kill() {
    if (this.pstate === 'dead') return;
    this.enter('dead');
    this.body.setVelocity(0, -220);
    this.body.checkCollision.none = true;
  }

  respawn(x: number, y: number) {
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.body.checkCollision.none = false;
    this.enter('normal');
    this.setAngle(0).setAlpha(1);
    this.facing = 1;
    this.invulnUntil = this.scene.time.now + 800;
  }

  /** Cutscenes: stop and stand still. */
  freeze(on: boolean) {
    if (on) {
      if (this.pstate === 'dead') return;
      this.enter('frozen');
      this.body.setVelocityX(0);
    } else if (this.pstate === 'frozen') {
      this.enter('normal');
    }
  }

  private enter(s: PlayerState) {
    this.pstate = s;
    this.stateT = 0;
  }

  private solidAt(px: number, py: number) {
    return blocks(this.world.terrainAt(px, py));
  }

  tick(c: Controls, dtMs: number) {
    const dt = dtMs / 1000;
    const s = this.stats;
    const b = this.body;
    this.stateT += dtMs;

    if (this.pstate === 'dead') {
      b.setGravityY(s.gravityDown * 0.7);
      if (!this.world.reducedMotion) this.setAngle(this.angle + 8 * this.facing);
      this.syncVisuals();
      return;
    }
    if (this.pstate === 'frozen') {
      b.setGravityY(s.gravityDown);
      b.setVelocityX(0);
      this.syncVisuals();
      return;
    }

    if (this.onGround) {
      this.coyote = COYOTE_MS;
      if (this.pstate === 'pogo') this.enter('normal');
    } else {
      this.coyote -= dtMs;
    }

    if (this.pstate === 'hurt') {
      if (this.stateT > HURT_MS && (this.onGround || this.stateT > HURT_MS * 1.6))
        this.enter('normal');
    }
    const controllable = this.pstate !== 'hurt';

    // ---- horizontal ----
    const groundAttack = this.pstate === 'attack' && this.onGround;
    const target = controllable && !groundAttack ? c.dx * s.runSpeed : 0;
    const accel = this.onGround ? (target === 0 ? s.groundDecel : s.groundAccel) : s.airAccel;
    if (controllable) {
      const vx = b.velocity.x;
      const step = accel * dt;
      b.setVelocityX(Math.abs(target - vx) <= step ? target : vx + Math.sign(target - vx) * step);
    }
    if (controllable && this.pstate !== 'attack' && c.dx !== 0) this.facing = c.dx > 0 ? 1 : -1;

    // ---- jump ----
    if (controllable && c.buffered('jump', JUMP_BUFFER_FRAMES)) {
      if (this.onGround && c.held('down') && this.standingOnOneWay()) {
        this.dropUntil = this.scene.time.now + 220;
        c.consume('jump');
      } else if (this.coyote > 0) {
        b.setVelocityY(-s.jumpVelocity);
        this.coyote = 0;
        this.jumpCutDone = false;
        c.consume('jump');
      }
    }
    // Variable jump height: releasing early cuts the ascent.
    if (!this.jumpCutDone && b.velocity.y < 0 && !c.held('jump')) {
      b.setVelocityY(b.velocity.y * s.jumpCut);
      this.jumpCutDone = true;
    }
    if (b.velocity.y >= 0) this.jumpCutDone = true;

    if (b.velocity.y < 0) this.cornerCorrect(dt);

    // ---- attack ----
    if (this.pstate === 'attack') this.tickAttack();
    if (controllable && c.pressed('attack') && (this.pstate === 'normal' || this.pstate === 'pogo'))
      this.startAttack();

    // ---- pogo ----
    if (controllable && this.pstate === 'normal' && !this.onGround && c.held('down'))
      this.enter('pogo');

    // ---- gravity ----
    const vy = b.velocity.y;
    const holding = c.held('jump') && this.pstate !== 'hurt';
    let g = vy < 0 && holding ? s.gravityUp : s.gravityDown;
    if (holding && Math.abs(vy) < APEX_SPEED && !this.onGround)
      g = s.gravityUp * APEX_GRAVITY_SCALE;
    b.setGravityY(g);

    this.syncVisuals();
  }

  /* ------------------------------------------------------------ attacks */

  private startAttack() {
    this.enter('attack');
    this.swingId++;
  }

  private tickAttack() {
    const st = this.stats.attack;
    if (this.stateT >= st.windup + st.active + st.recovery) this.enter('normal');
  }

  /* ------------------------------------------------------------ helpers */

  /**
   * If the head is about to clip a ceiling corner by only a few pixels,
   * slide sideways so the jump continues instead of bonking.
   */
  private cornerCorrect(dt: number) {
    const b = this.body;
    const headY = b.top + b.velocity.y * dt - 1;
    const leftHit = this.solidAt(b.left + 1, headY);
    const rightHit = this.solidAt(b.right - 1, headY);
    if (leftHit === rightHit) return;
    for (let n = 1; n <= CORNER_CORRECTION_PX; n++) {
      const dx = leftHit ? n : -n;
      if (!this.solidAt(b.left + 1 + dx, headY) && !this.solidAt(b.right - 1 + dx, headY)) {
        this.x += dx;
        b.x += dx;
        return;
      }
    }
  }

  private standingOnOneWay(): boolean {
    const y = this.body.bottom + 2;
    const under = (x: number) => this.world.terrainAt(x, y);
    return under(this.body.left + 1) === 'desk' && !blocks(under(this.body.right - 1));
  }

  private syncVisuals() {
    const b = this.body;
    const s = this.stats;
    this.setFlipX(this.facing < 0);
    let fx = -1;
    let fade = 1;
    switch (this.pstate) {
      case 'dead':
      case 'hurt':
        this.anims.stop();
        this.setFrame(F.hurt);
        break;
      case 'attack': {
        this.anims.stop();
        const st = s.attack;
        if (this.stateT < st.windup) {
          this.setFrame(F.windup);
          fx = s.fx.windup;
        } else {
          this.setFrame(st.frame);
          fx = st.fx;
          const t = this.stateT - st.windup - st.active;
          if (t > 0) fade = Math.max(0, 1 - t / st.recovery);
        }
        break;
      }
      case 'pogo':
        this.anims.stop();
        this.setFrame(F.pogo);
        fx = s.fx.pogo;
        break;
      default:
        if (this.onGround) {
          if (Math.abs(b.velocity.x) > 8) this.anims.play(`${s.sprite}-run`, true);
          else this.anims.play(`${s.sprite}-idle`, true);
        } else {
          this.anims.stop();
          this.setFrame(b.velocity.y < 0 ? F.jump : F.fall);
        }
    }
    // Invulnerability: a slow blink, or a steady fade under reduced motion (no flashing).
    const until = this.pstate === 'dead' ? 0 : this.invulnUntil;
    this.setAlpha(hurtAlpha(this.scene.time.now, until, this.world.reducedMotion));

    this.weapon.setVisible(fx >= 0 && this.visible);
    if (fx >= 0) {
      this.weapon.setFrame(fx);
      // The raised laptop sits behind the head; everything else is in front.
      this.weapon.setDepth(fx === 0 ? this.depth - 1 : this.depth + 1);
      this.weapon
        .setPosition(this.x, this.y)
        .setFlipX(this.facing < 0)
        .setAlpha(this.alpha * fade);
    }
  }

  destroy(fromScene?: boolean) {
    this.weapon.destroy();
    super.destroy(fromScene);
  }
}

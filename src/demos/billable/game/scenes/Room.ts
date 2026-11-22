// Adapted from the Billable. game source (src/scenes/Level.ts): one room, one class, one enemy.
// Kept from the original: terrain auto-tiling, one-way desks, combat resolution (swing, pogo,
// contact damage), hitstop, pickups and leaked emails. Dropped: room transitions, bosses,
// checkpoints, saves, HUD scene, decor and sound. The banded sky follows src/art/backgrounds.ts.
// Under reduced motion there is no screen shake, hit spark or flashing.
import Phaser from 'phaser';
import { Controls, KeyboardSource } from '../core/input';
import { touchInput } from '../../touch';
import { compileAll } from '../art/compile';
import { TILE, SOLID_TILES, DESK_TILES } from '../art/sprites';
import { parseStage, blocks, TILE_SIZE, type ParsedStage, type Terrain } from '../levels/format';
import { MINI_ROOM } from '../levels/room';
import { Player, type PlayerWorld } from '../entities/Player';
import { ASSOCIATE_STATS } from '../entities/classes';
import { Enemy, Stapler, type LevelApi } from '../entities/Enemy';
import { Pickup, splitHours } from '../entities/Pickup';
import type { Line } from './Dialogue';
import type { GameHost } from '../../host';

const T = TILE_SIZE;
const DEATH_RESPAWN_MS = 1400;
/** Long enough for the dropped hours to land and be grabbed. */
const CLEARED_DELAY_MS = 1800;
/** Floor 12 dusk, top to bottom (src/art/themes.ts). */
const SKY = [
  '#16142b',
  '#1c1937',
  '#241e44',
  '#2e2350',
  '#3a2858',
  '#4c2e5e',
  '#653462',
  '#843d64',
  '#a64a63',
  '#c95e60',
];
const HORIZON = '#e58a5f';

const intersects = Phaser.Geom.Intersects.RectangleToRectangle;
const bodyRect = (b: Phaser.Physics.Arcade.Body, inset = 0) =>
  new Phaser.Geom.Rectangle(b.x + inset, b.y + inset, b.width - inset * 2, b.height - inset * 2);

/** Drop destroyed objects from an array without replacing it. */
function prune<U extends { active: boolean }>(arr: U[]) {
  let j = 0;
  for (const x of arr) if (x.active) arr[j++] = x;
  arr.length = j;
}

export class RoomScene extends Phaser.Scene implements LevelApi, PlayerWorld {
  player!: Player;
  readonly reducedMotion: boolean;
  private readonly host: GameHost;
  private controls!: Controls;
  private stage!: ParsedStage;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  /** Plain arrays (not physics groups): groups would reset per-body gravity on add. */
  private readonly enemies: Enemy[] = [];
  private readonly pickups: Pickup[] = [];
  private mails: { sprite: Phaser.GameObjects.Sprite; text: string; found: boolean }[] = [];
  private respawnAt = new Phaser.Math.Vector2();
  private frozenUntil = 0;
  /** Jump/attack presses are swallowed until this time (after dialogue closes). */
  private inputLockUntil = 0;
  private cutscene = false;
  private cleared = false;
  private hours = 0;
  private hp = ASSOCIATE_STATS.maxHp;

  constructor(host: GameHost) {
    super('Room');
    this.host = host;
    this.reducedMotion = host.reducedMotion;
  }

  create() {
    compileAll(this);
    this.stage = parseStage(MINI_ROOM);
    this.enemies.length = 0;
    this.pickups.length = 0;
    this.mails = [];
    this.cutscene = false;
    this.cleared = false;
    this.frozenUntil = 0;
    this.inputLockUntil = 0;
    this.hours = 0;
    this.hp = ASSOCIATE_STATS.maxHp;

    this.controls = new Controls().add(new KeyboardSource(this)).add(touchInput);

    this.buildBackground();
    this.buildTerrain();
    this.physics.world.setBounds(0, -T * 8, this.stage.width * T, this.stage.height * T + T * 16);
    this.physics.world.setBoundsCollision(false, false, false, false);

    const sp = this.stage.spawn;
    this.respawnAt.set(sp.tx * T + T / 2, (sp.ty + 1) * T - 11);
    this.player = new Player(this, this, this.respawnAt.x, this.respawnAt.y, ASSOCIATE_STATS);

    for (const e of this.stage.entities) {
      const x = e.tx * T + T / 2;
      const y = e.ty * T + T / 2;
      switch (e.type) {
        case 'hours-1':
        case 'hours-5':
        case 'hours-20':
          this.pickups.push(
            new Pickup(this, x, y, Number(e.type.split('-')[1]), false, this.reducedMotion),
          );
          break;
        case 'email': {
          const sprite = this.add.sprite(x, y, 'email').setDepth(4);
          if (!this.reducedMotion) {
            sprite.play('email-blink');
            this.tweens.add({
              targets: sprite,
              y: sprite.y - 3,
              duration: 700,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.inOut',
            });
          }
          this.mails.push({ sprite, text: e.text ?? '', found: false });
          break;
        }
        case 'stapler':
          this.enemies.push(new Stapler(this, this, x, (e.ty + 1) * T - 7));
          break;
        default:
          break;
      }
    }

    this.physics.add.collider(this.player, this.layer, undefined, (_p, tile) =>
      this.oneWayCheck(this.player.body, tile as Phaser.Tilemaps.Tile, this.player.dropUntil),
    );
    this.physics.add.collider(this.enemies, this.layer, undefined, (e, tile) =>
      this.oneWayCheck((e as Enemy).body, tile as Phaser.Tilemaps.Tile, 0),
    );
    this.physics.add.collider(this.pickups, this.layer, undefined, (p, tile) =>
      this.oneWayCheck((p as Pickup).body, tile as Phaser.Tilemaps.Tile, 0),
    );

    const cam = this.cameras.main;
    cam.setRoundPixels(true);
    cam.setBounds(0, 0, this.stage.width * T, this.stage.height * T);

    this.events.once('shutdown', () => this.scene.stop('Dialogue'));
    this.reportStatus();
    this.host.onReady();
  }

  /* ================================================================ world */

  terrainAt(px: number, py: number): Terrain {
    const tx = Math.floor(px / T);
    const ty = Math.floor(py / T);
    if (tx < 0 || ty < 0 || tx >= this.stage.width || ty >= this.stage.height) return 'empty';
    return this.stage.terrain[ty][tx];
  }

  /** Desks are one-way: solid only when landing on them from above. */
  private oneWayCheck(
    body: Phaser.Physics.Arcade.Body,
    tile: Phaser.Tilemaps.Tile,
    dropUntil: number,
  ): boolean {
    if (!DESK_TILES.includes(tile.index)) return true;
    if (this.time.now < dropUntil) return false;
    const prevBottom = body.prev.y + body.height;
    return body.velocity.y >= 0 && prevBottom <= tile.pixelY + 2;
  }

  private buildTerrain() {
    const { terrain, width, height } = this.stage;
    const solid = (x: number, y: number) =>
      x < 0 || x >= width || y < 0 || y >= height || blocks(terrain[y][x]);
    const desk = (x: number, y: number) => terrain[y]?.[x] === 'desk';
    const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
    const data = terrain.map((row, y) =>
      row.map((t, x) => {
        switch (t) {
          case 'solid': {
            const up = solid(x, y - 1);
            const down = solid(x, y + 1);
            if (!up && !down) return TILE.slab;
            if (!up) return TILE.floorTop;
            if (!down) return hash(x, y) % 4 === 0 ? TILE.ceilingLight : TILE.ceiling;
            if (!solid(x - 1, y)) return TILE.wallLeft;
            if (!solid(x + 1, y)) return TILE.wallRight;
            const h = hash(x, y) % 9;
            return h === 0 ? TILE.fillDuct : h === 1 ? TILE.fillPipes : TILE.floorFill;
          }
          case 'desk': {
            const l = desk(x - 1, y);
            const r = desk(x + 1, y);
            return l && r ? TILE.deskMid : l ? TILE.deskRight : r ? TILE.desk : TILE.deskSingle;
          }
          default:
            return -1;
        }
      }),
    );
    const map = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const tileset = map.addTilesetImage('tiles', 'tiles', T, T, 0, 0);
    if (!tileset) throw new Error('tileset failed');
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) throw new Error('layer failed');
    layer.setDepth(2);
    layer.setCollision([...SOLID_TILES, ...DESK_TILES]);
    this.layer = layer;
  }

  /** Sky, banded like a 16-bit gradient, behind a dim office wall. */
  private buildBackground() {
    const g = this.add.graphics().setDepth(-10).setScrollFactor(0);
    const bh = Math.ceil(170 / SKY.length);
    SKY.forEach((c, i) =>
      g.fillStyle(Phaser.Display.Color.HexStringToColor(c).color, 1).fillRect(0, i * bh, 400, bh),
    );
    g.fillStyle(Phaser.Display.Color.HexStringToColor(HORIZON).color, 1).fillRect(0, 170, 400, 54);
    // Window mullions: the open plan looks out over the city.
    g.fillStyle(0x14121c, 1);
    for (let x = 0; x < 400; x += 80) g.fillRect(x, 0, 6, 224);
    g.fillRect(0, 96, 400, 4);
  }

  /* ============================================================ helpers */

  dropHours(x: number, y: number, amount: number) {
    for (const v of splitHours(amount))
      this.pickups.push(new Pickup(this, x, y, v, true, this.reducedMotion));
  }

  poof(x: number, y: number, tint = 0xffffff) {
    const em = this.add
      .particles(x, y, 'pix', {
        speed: { min: 40, max: 110 },
        lifespan: { min: 200, max: 420 },
        scale: { start: 1, end: 0 },
        tint: [tint, 0xdbe7f2, 0xa7b0ba],
        emitting: false,
      })
      .setDepth(12);
    em.explode(12);
    this.time.delayedCall(600, () => em.destroy());
  }

  private spark(x: number, y: number) {
    if (this.reducedMotion) return;
    const s = this.add.sprite(x, y, 'spark').setDepth(13);
    s.play('spark-pop');
    s.once('animationcomplete', () => s.destroy());
  }

  private shake(ms: number, intensity: number) {
    if (!this.reducedMotion) this.cameras.main.shake(ms, intensity);
  }

  private hitstop(ms: number) {
    this.frozenUntil = this.time.now + ms;
    this.physics.world.pause();
  }

  private reportStatus() {
    this.host.onStatus({ hours: this.hours, hp: this.hp, maxHp: ASSOCIATE_STATS.maxHp });
  }

  private playLines(lines: Line[]) {
    this.cutscene = true;
    this.player.freeze(true);
    for (const e of this.enemies) e.body.setVelocityX(0);
    this.scene.launch('Dialogue', {
      lines,
      reducedMotion: this.reducedMotion,
      onDone: () => {
        this.cutscene = false;
        this.player.freeze(false);
        // The button that closed the box must not also jump or swing.
        this.inputLockUntil = this.time.now + 180;
      },
    });
    this.scene.bringToTop('Dialogue');
  }

  /* ================================================================ loop */

  update(_time: number, delta: number) {
    // While the dialogue is up it owns the input.
    if (this.cutscene) return;
    this.controls.update();
    const now = this.time.now;
    if (now < this.inputLockUntil) {
      this.controls.consume('jump');
      this.controls.consume('attack');
    }

    if (now < this.frozenUntil) return;
    if (this.physics.world.isPaused) this.physics.world.resume();

    prune(this.enemies);
    prune(this.pickups);
    const dt = Math.min(delta, 50);
    this.player.tick(this.controls, dt);
    for (const e of [...this.enemies]) if (e.active) e.tick(dt);

    if (this.player.pstate !== 'dead') {
      this.resolveCombat();
      this.resolveCollectables(now);
    }

    if (!this.cleared && this.enemies.length === 0) {
      this.cleared = true;
      this.host.onAnnounce('The Red Stapler is down.');
      this.time.delayedCall(CLEARED_DELAY_MS, () => this.host.onCleared(this.hours));
    }
  }

  private resolveCombat() {
    const p = this.player;
    const enemies = this.enemies.filter((e) => e.active && !e.dead);

    // Swing.
    const atk = p.attackBox();
    if (atk) {
      for (const e of enemies) {
        if (!e.active || !e.body || e.lastSwing === p.swingId) continue;
        if (intersects(atk, e.hurtbox())) {
          e.lastSwing = p.swingId;
          if (e.takeHit(p.hitDamage, p.x)) this.onHitLanded(e.x - p.facing * 6, e.y);
        }
      }
    }

    // Down-thrust.
    let bounced = false;
    const pogo = p.pogoBox();
    if (pogo) {
      for (const e of enemies) {
        if (!e.active || !e.body || !e.bounceable) continue;
        if (intersects(pogo, e.hurtbox())) {
          if (e.takeHit(1, p.x)) this.onHitLanded(p.x, p.body.bottom);
          bounced = true;
          break;
        }
      }
      if (bounced) p.bounce(this.controls.held('jump'));
    }

    // Contact damage.
    if (!bounced && !p.invulnerable) {
      const pr = bodyRect(p.body, 2);
      for (const e of enemies) {
        // A swing earlier this frame may have destroyed it.
        if (!e.active || e.dead || !e.body) continue;
        if (e.contactDamage > 0 && intersects(pr, bodyRect(e.body, 1))) {
          this.damagePlayer(e.contactDamage, e.x);
          break;
        }
      }
    }
  }

  private onHitLanded(x: number, y: number) {
    this.spark(x, y);
    this.hitstop(55);
    this.shake(70, 0.004);
  }

  private damagePlayer(amount: number, fromX: number) {
    if (!this.player.hurt(amount, fromX)) return;
    this.hp = Math.max(0, this.hp - amount);
    this.shake(120, 0.008);
    this.reportStatus();
    if (this.hp <= 0) this.killPlayer();
  }

  private killPlayer() {
    this.player.kill();
    this.host.onAnnounce('Out of wellbeing. Back to your desk.');
    this.time.delayedCall(DEATH_RESPAWN_MS, () => {
      this.hp = ASSOCIATE_STATS.maxHp;
      this.player.respawn(this.respawnAt.x, this.respawnAt.y);
      this.reportStatus();
    });
  }

  private resolveCollectables(now: number) {
    const pr = bodyRect(this.player.body);
    let changed = false;
    for (const item of this.pickups) {
      if (!item.active || now < item.collectableAt || !intersects(pr, bodyRect(item.body)))
        continue;
      this.hours += item.value;
      changed = true;
      item.destroy();
    }
    if (changed) this.reportStatus();

    for (const m of this.mails) {
      const zone = new Phaser.Geom.Rectangle(m.sprite.x - 8, m.sprite.y - 7, 16, 14);
      if (m.found || !intersects(pr, zone)) continue;
      m.found = true;
      m.sprite.stop();
      m.sprite.setAlpha(0.3);
      this.poof(m.sprite.x, m.sprite.y, 0xe0465a);
      const text = `LEAKED EMAIL. ${m.text}`;
      this.host.onAnnounce(`${text} Press Jump or Attack to close.`);
      this.playLines([{ who: 'email', text }]);
    }
  }
}

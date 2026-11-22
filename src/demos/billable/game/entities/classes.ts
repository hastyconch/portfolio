// Vendored from the Billable. game source (src/entities/player/classes.ts). Trimmed to the one
// class this room plays (the Associate): no specials, bolts, glide or character-select fields.
// Movement numbers are unchanged.

/** All speeds in px/s, gravity in px/s², times in ms. */
export interface AttackStep {
  windup: number;
  active: number;
  recovery: number;
  damage: number;
  /** Hitbox width in front of the body. */
  reach: number;
  height: number;
  /** Frame on the class sprite while active. */
  frame: number;
  /** Frame on the class FX overlay while active (-1 for none). */
  fx: number;
}

export interface ClassStats {
  name: string;
  /** Texture key; FX overlay is `${sprite}-fx`. */
  sprite: string;
  maxHp: number;
  runSpeed: number;
  groundAccel: number;
  groundDecel: number;
  airAccel: number;
  jumpVelocity: number;
  gravityUp: number;
  gravityDown: number;
  maxFall: number;
  /** Multiplier applied to upward velocity when jump is released early. */
  jumpCut: number;
  pogoBounce: number;
  pogoBounceHeld: number;
  attack: AttackStep;
  /** 0..1, how much knockback is reduced. */
  knockbackResist: number;
  /** FX overlay frames for the windup and pogo poses (-1 for none). */
  fx: { windup: number; pogo: number };
}

/** Shared movement feel. */
const BASE = {
  groundAccel: 1100,
  groundDecel: 1400,
  airAccel: 800,
  jumpVelocity: 310,
  gravityUp: 720,
  gravityDown: 1000,
  maxFall: 320,
  jumpCut: 0.42,
  pogoBounce: 290,
  pogoBounceHeld: 345,
};

/** Shared frame indices on the class sprite. */
export const F = {
  idle0: 0,
  idle1: 1,
  run0: 2,
  run1: 3,
  run2: 4,
  run3: 5,
  jump: 6,
  fall: 7,
  windup: 8,
  attack1: 9,
  pogo: 10,
  hurt: 11,
} as const;

export const ASSOCIATE_STATS: ClassStats = {
  ...BASE,
  name: 'The Associate',
  sprite: 'associate',
  maxHp: 8,
  runSpeed: 100,
  attack: {
    windup: 55,
    active: 120,
    recovery: 90,
    damage: 1,
    reach: 22,
    height: 20,
    frame: F.attack1,
    fx: 1,
  },
  knockbackResist: 0.4,
  fx: { windup: 0, pogo: 2 },
};

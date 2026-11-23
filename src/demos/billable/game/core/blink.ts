// The hurt blink while the player is invulnerable (WO-025). It alternates full and dim every
// BLINK_HALF_MS: 2.5 blinks a second, under the 3 per second that WCAG 2.3.1 allows (it used to
// flip every 60ms, about 8 a second). The phases count back from the end of the window, so it
// always ends on a full phase. For the windows the player uses (1300ms after a hit, 800ms after a
// respawn) the only partial phase is a full one, next to the full alpha before the hit: no phase
// you can see is shorter than BLINK_HALF_MS. Under reduced motion it is a steady fade instead,
// as before.
// Kept free of Phaser so the rate can be checked on its own (tests/e2e/demo-billable.spec.ts).

/** One dim or full phase of the blink, in ms. A full blink is twice this. */
export const BLINK_HALF_MS = 200;
const DIM = 0.25;
const STEADY = 0.6;

/** The player's alpha at `now` (ms) while invulnerable until `invulnUntil`. */
export function hurtAlpha(now: number, invulnUntil: number, reducedMotion: boolean): number {
  const invuln = now < invulnUntil;
  if (reducedMotion) return invuln ? STEADY : 1;
  if (!invuln) return 1;
  return Math.floor((invulnUntil - now) / BLINK_HALF_MS) % 2 === 1 ? DIM : 1;
}

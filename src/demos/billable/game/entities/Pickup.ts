// Vendored from the Billable. game source (src/entities/pickups.ts). Trimmed to Billable Hours
// (no coffee or donuts). Under reduced motion placed coins neither spin nor bob.
import Phaser from 'phaser';

/** Hours coins. Placed ones float; dropped ones bounce. */
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  readonly value: number;
  /** Can't be collected for a moment after dropping, so it visibly pops out. */
  collectableAt: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    value: number,
    dropped: boolean,
    reducedMotion: boolean,
  ) {
    super(scene, x, y, `hours-${value}`, 0);
    this.value = value;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(4);
    this.body.setSize(Math.min(8, this.width - 2), Math.min(8, this.height - 2));
    if (!reducedMotion) this.play(`hours-${value}-spin`);
    this.collectableAt = dropped ? scene.time.now + 250 : 0;
    if (dropped) {
      this.body.setGravityY(650);
      this.body.setBounce(0.45, 0.45);
      this.body.setDrag(60, 0);
      this.body.setVelocity(Phaser.Math.Between(-70, 70), Phaser.Math.Between(-210, -140));
    } else {
      this.body.setAllowGravity(false);
      if (!reducedMotion)
        scene.tweens.add({
          targets: this,
          y: y - 2,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
    }
  }
}

/** Split an amount of hours into the fewest coins (20 / 5 / 1). */
export function splitHours(amount: number): number[] {
  const coins: number[] = [];
  let left = Math.max(0, Math.floor(amount));
  for (const v of [20, 5, 1]) {
    while (left >= v) {
      coins.push(v);
      left -= v;
    }
  }
  return coins;
}

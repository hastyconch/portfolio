// Vendored from the Billable. game source (src/core/input.ts). Trimmed: no gamepad, no special
// or pause actions (Esc is handled by the page, which pauses the game and takes focus back).
// Controls (held / pressed / buffered) is unchanged.
import Phaser from 'phaser';
import { ACTIONS, type Action, type ActionState, type InputSource } from '../../touch';

export type { Action };

const empty = (): ActionState => ({
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  attack: false,
});

const KEYMAP: Record<Action, string[]> = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  up: ['UP', 'W'],
  down: ['DOWN', 'S'],
  jump: ['Z', 'SPACE'],
  attack: ['X'],
};

export class KeyboardSource implements InputSource {
  private keys: Partial<Record<Action, Phaser.Input.Keyboard.Key[]>> = {};
  /** Keys pressed since the last poll: a tap shorter than one frame still counts. */
  private tapped = new Set<Action>();

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) return;
    for (const a of ACTIONS) {
      this.keys[a] = KEYMAP[a].map((k) => {
        const key = kb.addKey(k, true, false);
        key.on('down', () => this.tapped.add(a));
        return key;
      });
    }
  }
  poll(into: ActionState) {
    for (const a of ACTIONS)
      if (this.tapped.has(a) || this.keys[a]?.some((k) => k.isDown)) into[a] = true;
    this.tapped.clear();
  }
}

/**
 * The single place game code reads input from. Call update() once per frame,
 * then query held / pressed / released.
 */
export class Controls {
  private now: ActionState = empty();
  private prev: ActionState = empty();
  private sources: InputSource[] = [];
  /** Frames since the last press, for buffering (e.g. jump buffer). */
  private sincePress = Object.fromEntries(ACTIONS.map((a) => [a, 999])) as Record<Action, number>;

  add(source: InputSource) {
    this.sources.push(source);
    return this;
  }

  update() {
    this.prev = this.now;
    this.now = empty();
    for (const s of this.sources) s.poll(this.now);
    for (const a of ACTIONS) this.sincePress[a] = this.pressed(a) ? 0 : this.sincePress[a] + 1;
  }

  held(a: Action) {
    return this.now[a];
  }
  pressed(a: Action) {
    return this.now[a] && !this.prev[a];
  }
  released(a: Action) {
    return !this.now[a] && this.prev[a];
  }
  /** True if `a` was pressed within the last `frames` frames. */
  buffered(a: Action, frames: number) {
    return this.sincePress[a] <= frames;
  }
  /** Swallow a press: it no longer counts as pressed this frame or as buffered. */
  consume(a: Action) {
    this.sincePress[a] = 999;
    this.prev[a] = this.now[a];
  }
  /** -1, 0 or 1 */
  get dx() {
    return (this.now.right ? 1 : 0) - (this.now.left ? 1 : 0);
  }
}

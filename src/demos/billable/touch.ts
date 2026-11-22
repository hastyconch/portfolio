// Adapted from the Billable. game source (src/ui/TouchControls.ts): the shared touch state the
// game's Controls polls like a keyboard. The original draws its buttons on the canvas; here they
// are real HTML buttons (BillableMini.tsx), so this module has no Phaser import and ships with
// the poster.

export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack';
export const ACTIONS: Action[] = ['left', 'right', 'up', 'down', 'jump', 'attack'];
export type ActionState = Record<Action, boolean>;

/** Anything that can report held actions: keyboard, touch buttons. */
export interface InputSource {
  poll(into: ActionState): void;
}

class TouchInput implements InputSource {
  held: Partial<ActionState> = {};
  /** Presses since the last poll: a tap shorter than one frame still counts. */
  private tapped = new Set<Action>();

  press(a: Action) {
    this.held[a] = true;
    this.tapped.add(a);
  }
  release(a: Action) {
    this.held[a] = false;
  }
  reset() {
    this.held = {};
    this.tapped.clear();
  }
  poll(into: ActionState) {
    for (const a of ACTIONS) if (this.held[a] || this.tapped.has(a)) into[a] = true;
    this.tapped.clear();
  }
}

export const touchInput = new TouchInput();

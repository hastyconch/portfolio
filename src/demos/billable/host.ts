// The contract between the page (BillableMini.tsx) and the lazily loaded game chunk.
// Types only, so importing it from the poster costs no bytes.

export interface GameHost {
  /** prefers-reduced-motion: no screen shake, no flashing, no bobbing. */
  readonly reducedMotion: boolean;
  /** The room is built and the first frame is drawn. */
  onReady(): void;
  /** Hours or wellbeing changed. */
  onStatus(status: { hours: number; hp: number; maxHp: number }): void;
  /** A short event for the screen-reader live region. */
  onAnnounce(message: string): void;
  /** The Red Stapler is down. */
  onCleared(hours: number): void;
}

export interface GameHandle {
  pause(): void;
  resume(): void;
  replay(): void;
  destroy(): void;
}

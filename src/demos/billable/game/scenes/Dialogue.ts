// Vendored from the Billable. game source (src/scenes/Dialogue.ts). Trimmed to the one speaker
// this room has (a leaked email): no script file, class portraits or sound. Touch buttons can
// advance it too. Under reduced motion text appears at once and the "more" arrow stays still.
import Phaser from 'phaser';
import { Controls, KeyboardSource } from '../core/input';
import { touchInput } from '../../touch';
import { fontSafe, FONT_CELL } from '../art/font';
import { wrap } from '../core/wrap';

export interface Line {
  who: 'email';
  text: string;
}

const SPEAKER_NAMES: Record<Line['who'], string> = { email: 'Inbox (1)' };
const BRAND = { black: 0x0d0b12, green: 0x8cc63f, greenDark: 0x4f8a1f } as const;

const BOX = { x: 6, y: 20, w: 388, h: 68 };
const TEXT_X = BOX.x + 52;
const CHARS_PER_LINE = Math.floor((BOX.w - 60) / FONT_CELL.w);
const LINES_PER_PAGE = 4;
const CHARS_PER_SEC = 55;

interface Page {
  who: Line['who'];
  text: string;
}

/**
 * Dialogue overlay: portrait, speaker, typewriter text. Runs on top of the
 * Room (which freezes itself) and calls onDone when the script ends.
 * Jump / attack / tap: finish the line, then advance.
 */
export class DialogueScene extends Phaser.Scene {
  private pages: Page[] = [];
  private index = 0;
  private shown = 0;
  private controls!: Controls;
  private onDone: () => void = () => undefined;
  private instant = false;
  private nameText!: Phaser.GameObjects.BitmapText;
  private bodyText!: Phaser.GameObjects.BitmapText;
  private more!: Phaser.GameObjects.BitmapText;
  private tapped = false;
  private openedAt = 0;

  constructor() {
    super('Dialogue');
  }

  create(data: { lines: Line[]; onDone: () => void; reducedMotion: boolean }) {
    this.onDone = data.onDone;
    this.instant = data.reducedMotion;
    this.pages = [];
    for (const l of data.lines) {
      const lines = wrap(fontSafe(l.text), CHARS_PER_LINE);
      for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
        this.pages.push({ who: l.who, text: lines.slice(i, i + LINES_PER_PAGE).join('\n') });
      }
    }
    this.index = 0;
    this.shown = 0;
    this.openedAt = this.time.now;
    this.tapped = false;

    this.controls = new Controls().add(new KeyboardSource(this)).add(touchInput);
    this.input.on('pointerdown', () => (this.tapped = true));

    const g = this.add.graphics();
    g.fillStyle(BRAND.black, 0.94).fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
    g.lineStyle(1, BRAND.greenDark, 1).strokeRect(BOX.x + 0.5, BOX.y + 0.5, BOX.w - 1, BOX.h - 1);
    g.fillStyle(0x2a2740, 1).fillRect(BOX.x + 6, BOX.y + 8, 40, 40);
    g.lineStyle(1, 0x4b5260, 1).strokeRect(BOX.x + 6.5, BOX.y + 8.5, 39, 39);
    this.add.image(BOX.x + 26, BOX.y + 28, 'portraits', 0).setScale(2);
    this.nameText = this.add.bitmapText(TEXT_X, BOX.y + 6, 'font', '').setTint(BRAND.green);
    this.bodyText = this.add.bitmapText(TEXT_X, BOX.y + 19, 'font', '');
    this.bodyText.setLineSpacing(2);
    this.more = this.add
      .bitmapText(BOX.x + BOX.w - 10, BOX.y + BOX.h - 11, 'font', 'v')
      .setTint(BRAND.green);
    if (!this.instant)
      this.tweens.add({
        targets: this.more,
        y: this.more.y + 2,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    this.showPage();
  }

  private showPage() {
    const page = this.pages[this.index];
    this.shown = this.instant ? page.text.length : 0;
    this.nameText.setText(fontSafe(SPEAKER_NAMES[page.who]));
    this.bodyText.setText(this.instant ? page.text : '');
    this.bodyText.setTint(0xf5c542);
  }

  update(_t: number, delta: number) {
    this.controls.update();
    const page = this.pages[this.index];
    if (!page) return;
    const full = page.text.length;
    const before = Math.floor(this.shown);
    this.shown = Math.min(full, this.shown + (CHARS_PER_SEC * delta) / 1000);
    const now = Math.floor(this.shown);
    if (now !== before) this.bodyText.setText(page.text.slice(0, now));
    this.more.setVisible(now >= full);

    // Ignore input in the first moments so a held button doesn't skip line one.
    const advance =
      this.time.now - this.openedAt > 250 &&
      (this.controls.pressed('jump') || this.controls.pressed('attack') || this.tapped);
    this.tapped = false;
    if (!advance) return;
    if (now < full) {
      this.shown = full;
      this.bodyText.setText(page.text);
      return;
    }
    this.index++;
    if (this.index >= this.pages.length) {
      const done = this.onDone;
      this.scene.stop();
      done();
      return;
    }
    this.showPage();
  }
}

// Vendored from the Billable. game source (src/art/raster.ts). Unchanged.
/**
 * Pure (no Phaser) pixel-art rasterizer. Sprites are authored as rows of
 * characters; each character maps to a colour in a palette and '.' is
 * transparent. Kept framework-free so it can be unit tested in Node.
 */

export type Palette = Record<string, string>;

export interface SpriteDef {
  key: string;
  w: number;
  h: number;
  /** Each frame is `h` rows of exactly `w` characters. */
  frames: string[][];
  palette: Palette;
  /** Outline colour added around opaque pixels; null disables. Default: dark ink. */
  outline?: string | null;
}

export const INK = '#1a1423';

export function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(h)) throw new Error(`Bad colour "${hex}"`);
  const n = parseInt(h.slice(0, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

/** Throws a descriptive error if any frame is malformed or uses unknown characters. */
export function validateSprite(def: SpriteDef): void {
  if (def.frames.length === 0) throw new Error(`${def.key}: no frames`);
  def.frames.forEach((frame, fi) => {
    if (frame.length !== def.h) {
      throw new Error(`${def.key} frame ${fi}: expected ${def.h} rows, got ${frame.length}`);
    }
    frame.forEach((row, ri) => {
      if (row.length !== def.w) {
        throw new Error(
          `${def.key} frame ${fi} row ${ri}: expected ${def.w} chars, got ${row.length} "${row}"`,
        );
      }
      for (const ch of row) {
        if (ch !== '.' && !(ch in def.palette)) {
          throw new Error(`${def.key} frame ${fi} row ${ri}: unknown palette char "${ch}"`);
        }
      }
    });
  });
}

/**
 * Rasterize all frames side by side into one RGBA buffer.
 * Width = w * frames, height = h.
 */
export function rasterize(def: SpriteDef): {
  width: number;
  height: number;
  data: Uint8ClampedArray;
} {
  validateSprite(def);
  const width = def.w * def.frames.length;
  const height = def.h;
  const data = new Uint8ClampedArray(width * height * 4);
  const colours: Record<string, [number, number, number, number]> = {};
  for (const [ch, hex] of Object.entries(def.palette)) colours[ch] = hexToRgba(hex);
  const outline = def.outline === undefined ? INK : def.outline;
  const ink = outline ? hexToRgba(outline) : null;

  def.frames.forEach((frame, fi) => {
    const ox = fi * def.w;
    const opaque = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < def.w && y < def.h && frame[y][x] !== '.';
    for (let y = 0; y < def.h; y++) {
      for (let x = 0; x < def.w; x++) {
        const ch = frame[y][x];
        let c: [number, number, number, number] | null = null;
        if (ch !== '.') c = colours[ch];
        else if (
          ink &&
          (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1))
        )
          c = ink;
        if (!c) continue;
        const i = (y * width + ox + x) * 4;
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        data[i + 3] = c[3];
      }
    }
  });
  return { width, height, data };
}

/** A part is a small grid of characters; '.' never overwrites. */
export type Part = string[];
export type Layer = [part: Part, x: number, y: number];

/** Stamp parts onto an empty w×h canvas, later layers on top. Parts may clip at the edges. */
export function compose(w: number, h: number, layers: Layer[]): string[] {
  const grid = Array.from({ length: h }, () => Array<string>(w).fill('.'));
  for (const [part, px, py] of layers) {
    part.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const ch = row[rx];
        const x = px + rx;
        const y = py + ry;
        if (ch === '.' || x < 0 || y < 0 || x >= w || y >= h) continue;
        grid[y][x] = ch;
      }
    });
  }
  return grid.map((r) => r.join(''));
}

/** Mirror a part horizontally. */
export const flipH = (part: Part): Part => part.map((r) => [...r].reverse().join(''));

/** Replace characters (palette swap at the grid level). */
export const recolor = (part: Part, map: Record<string, string>): Part =>
  part.map((r) => [...r].map((c) => map[c] ?? c).join(''));

/**
 * Draw a part procedurally: start blank, paint with rect/set, get rows back.
 * Useful for big, geometric sprites (windows, UI) that would be tedious as text.
 */
export function paint(w: number, h: number, draw: (p: Painter) => void): Part {
  const grid = Array.from({ length: h }, () => Array<string>(w).fill('.'));
  const set = (x: number, y: number, ch: string) => {
    if (x >= 0 && y >= 0 && x < w && y < h) grid[y][x] = ch;
  };
  const painter: Painter = {
    set,
    rect: (x, y, rw, rh, ch) => {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) set(x + i, y + j, ch);
    },
    part: (part, x, y) =>
      part.forEach((row, j) => [...row].forEach((c, i) => c !== '.' && set(x + i, y + j, c))),
    disc: (cx, cy, r, ch) => {
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, ch);
    },
  };
  draw(painter);
  return grid.map((r) => r.join(''));
}

export interface Painter {
  set(x: number, y: number, ch: string): void;
  rect(x: number, y: number, w: number, h: number, ch: string): void;
  part(part: Part, x: number, y: number): void;
  disc(cx: number, cy: number, r: number, ch: string): void;
}

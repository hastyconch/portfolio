// Vendored from the Billable. game source (src/levels/format.ts). Trimmed to the terrain and
// entities one room uses: no ladders, hazards, signs, checkpoints, exits or bosses. The parser and
// its validation (row sizes, one spawn, walled edges) are otherwise unchanged.

/**
 * Stage format.
 *
 * A stage is a set of ROOMS placed on a grid of screens. Each room is exactly
 * one screen (14 tiles) tall and a whole number of screens (25 tiles) wide.
 *
 * Terrain:   .  empty     #  solid block     =  desk (one-way platform)
 * Objects:   P  player spawn   @  leaked email (text from stage.emails)
 * Enemies:   s  stapler
 * Pickups:   1  hours ×1   5  hours ×5   $  hours ×20
 *
 * A room's left/right edge must be wall unless a neighbouring room continues there.
 */

export const TILE_SIZE = 16;
export const ROOM_ROWS = 14;
export const SCREEN_COLS = 25;

export type Terrain = 'empty' | 'solid' | 'desk';

/** Terrain that stops movement like a wall. */
export const blocks = (t: Terrain | undefined) => t === 'solid';
export type EntityType = 'spawn' | 'email' | 'stapler' | 'hours-1' | 'hours-5' | 'hours-20';

export interface RoomDef {
  id: string;
  /** Top-left position in screens: [screenX, screenY]. y grows downward. */
  at: [number, number];
  rows: string[];
}

export interface StageDef {
  id: string;
  name: string;
  rooms: RoomDef[];
  /** Text for each `@` leaked email, in reading order. */
  emails?: string[];
}

export interface EntitySpawn {
  type: EntityType;
  /** Global tile coordinates. */
  tx: number;
  ty: number;
  room: number;
  /** Text for emails. */
  text?: string;
}

export interface ParsedRoom {
  index: number;
  id: string;
  /** Tile rect in global tile coordinates. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ParsedStage {
  id: string;
  name: string;
  /** Size of the bounding box in tiles. */
  width: number;
  height: number;
  terrain: Terrain[][];
  rooms: ParsedRoom[];
  entities: EntitySpawn[];
  spawn: { tx: number; ty: number; room: number };
}

const TERRAIN: Record<string, Terrain> = { '.': 'empty', '#': 'solid', '=': 'desk' };
const ENTITIES: Record<string, EntityType> = {
  P: 'spawn',
  '@': 'email',
  s: 'stapler',
  '1': 'hours-1',
  '5': 'hours-5',
  $: 'hours-20',
};

export class LevelError extends Error {}

export function roomAt(stage: ParsedStage, tx: number, ty: number): ParsedRoom | undefined {
  return stage.rooms.find((r) => tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h);
}

export function parseStage(def: StageDef): ParsedStage {
  if (def.rooms.length === 0) throw new LevelError(`${def.id}: no rooms`);
  const rooms: ParsedRoom[] = def.rooms.map((r, index) => {
    if (r.rows.length !== ROOM_ROWS)
      throw new LevelError(`${def.id}/${r.id}: expected ${ROOM_ROWS} rows, got ${r.rows.length}`);
    const w = r.rows[0].length;
    if (w % SCREEN_COLS !== 0)
      throw new LevelError(`${def.id}/${r.id}: width ${w} is not a multiple of ${SCREEN_COLS}`);
    r.rows.forEach((row, y) => {
      if (row.length !== w)
        throw new LevelError(`${def.id}/${r.id} row ${y}: width ${row.length}, expected ${w}`);
    });
    const [sx, sy] = r.at;
    if (sx < 0 || sy < 0) throw new LevelError(`${def.id}/${r.id}: negative position`);
    return { index, id: r.id, x: sx * SCREEN_COLS, y: sy * ROOM_ROWS, w, h: ROOM_ROWS };
  });

  const width = Math.max(...rooms.map((r) => r.x + r.w));
  const height = Math.max(...rooms.map((r) => r.y + r.h));
  const terrain: Terrain[][] = Array.from({ length: height }, () =>
    Array<Terrain>(width).fill('empty'),
  );
  const entities: EntitySpawn[] = [];

  def.rooms.forEach((r, ri) => {
    const room = rooms[ri];
    r.rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const gx = room.x + x;
        const gy = room.y + y;
        if (ch in TERRAIN) terrain[gy][gx] = TERRAIN[ch];
        else if (ch in ENTITIES) entities.push({ type: ENTITIES[ch], tx: gx, ty: gy, room: ri });
        else throw new LevelError(`${def.id}/${r.id} row ${y} col ${x}: unknown character "${ch}"`);
      });
    });
  });

  const mails = entities.filter((e) => e.type === 'email');
  const mailTexts = def.emails ?? [];
  if (mails.length !== mailTexts.length)
    throw new LevelError(`${def.id}: ${mails.length} emails but ${mailTexts.length} email texts`);
  mails.forEach((m, i) => (m.text = mailTexts[i]));

  const spawns = entities.filter((e) => e.type === 'spawn');
  if (spawns.length !== 1)
    throw new LevelError(`${def.id}: needs exactly one P, found ${spawns.length}`);

  const stage: ParsedStage = {
    id: def.id,
    name: def.name,
    width,
    height,
    terrain,
    rooms,
    entities: entities.filter((e) => e.type !== 'spawn'),
    spawn: { tx: spawns[0].tx, ty: spawns[0].ty, room: spawns[0].room },
  };

  // Side openings must continue into a neighbouring room.
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (const [x, nx] of [
        [room.x, room.x - 1],
        [room.x + room.w - 1, room.x + room.w],
      ] as const) {
        if (blocks(terrain[y][x])) continue;
        if (!roomAt(stage, nx, y)) {
          throw new LevelError(
            `${def.id}/${room.id}: opening at row ${y - room.y} on the ${x === room.x ? 'left' : 'right'} edge leads nowhere`,
          );
        }
      }
    }
  }
  return stage;
}

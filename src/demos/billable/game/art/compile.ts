// Vendored from the Billable. game source (src/art/compile.ts). Trimmed to the sprites and
// animations one room uses; compileSprite and the bitmap-font setup are unchanged.
import Phaser from 'phaser';
import { rasterize, type SpriteDef } from './raster';
import { ALL_SPRITES } from './sprites';
import { FONT, FONT_CELL, FONT_CHARS } from './font';

/** Turn a SpriteDef into a canvas texture with numbered frames 0..n-1. */
export function compileSprite(scene: Phaser.Scene, def: SpriteDef): void {
  if (scene.textures.exists(def.key)) return;
  const { width, height, data } = rasterize(def);
  const tex = scene.textures.createCanvas(def.key, width, height);
  if (!tex) throw new Error(`Could not create texture ${def.key}`);
  tex.context.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
  def.frames.forEach((_, i) => tex.add(i, 0, i * def.w, 0, def.w, def.h));
  tex.refresh();
}

export function compileAll(scene: Phaser.Scene): void {
  if (scene.cache.bitmapFont.exists('font')) return;
  for (const def of [...ALL_SPRITES, FONT]) compileSprite(scene, def);
  const fontData = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: FONT.key,
    width: FONT_CELL.w,
    height: FONT_CELL.h,
    chars: FONT_CHARS,
    charsPerRow: FONT_CHARS.length,
    'offset.x': 0,
    'offset.y': 0,
    'spacing.x': 0,
    'spacing.y': 0,
    lineSpacing: 2,
  });
  scene.cache.bitmapFont.add('font', fontData);
  defineAnimations(scene);
}

function anim(
  scene: Phaser.Scene,
  key: string,
  tex: string,
  frames: number[],
  frameRate: number,
  repeat = -1,
) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: frames.map((frame) => ({ key: tex, frame })),
    frameRate,
    repeat,
  });
}

function defineAnimations(scene: Phaser.Scene) {
  anim(scene, 'associate-idle', 'associate', [0, 1], 2.5);
  anim(scene, 'associate-run', 'associate', [2, 3, 4, 5], 10);
  anim(scene, 'stapler-walk', 'stapler', [0, 1], 6);
  for (const v of [1, 5, 20]) anim(scene, `hours-${v}-spin`, `hours-${v}`, [0, 1, 2, 3], 6);
  anim(scene, 'email-blink', 'email', [0, 0, 0, 1], 4);
  anim(scene, 'spark-pop', 'spark', [0, 1], 24, 0);
}

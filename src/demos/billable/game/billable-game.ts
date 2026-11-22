// Entry point of the lazily loaded game chunk. BillableMini.tsx imports this with a dynamic
// import() only after the visitor presses Play, so Phaser never ships with the page.
// Game config adapted from the Billable. game source (src/main.ts).
import Phaser from 'phaser';
import { RoomScene } from './scenes/Room';
import { DialogueScene } from './scenes/Dialogue';
import { touchInput } from '../touch';
import type { GameHandle, GameHost } from '../host';

export const GAME_W = 400;
export const GAME_H = 224;

function hasWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl');
  } catch {
    return false;
  }
}

export function startGame(
  canvas: HTMLCanvasElement,
  parent: HTMLElement,
  host: GameHost,
): GameHandle {
  const game = new Phaser.Game({
    // A page-owned canvas needs an explicit renderer: WebGL when available, else Canvas 2D.
    type: hasWebGL() ? Phaser.WEBGL : Phaser.CANVAS,
    canvas,
    parent,
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#0d0b12',
    banner: false,
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: false,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, fps: 60, tileBias: 20 },
    },
    // Keys are read only while the canvas has focus, so the page stays usable around it.
    input: { keyboard: { target: canvas }, gamepad: false, activePointers: 4 },
    scene: [new RoomScene(host), DialogueScene],
  });

  let asleep = false;
  const room = () => game.scene.getScene('Room') as RoomScene | null;

  return {
    pause() {
      if (asleep) return;
      asleep = true;
      touchInput.reset();
      game.pause();
      game.loop.sleep();
    },
    resume() {
      if (!asleep) return;
      asleep = false;
      touchInput.reset();
      // Keys released while the page had focus must not stay held.
      for (const s of game.scene.getScenes(true)) s.input.keyboard?.resetKeys();
      game.loop.wake();
      game.resume();
    },
    replay() {
      touchInput.reset();
      game.scene.stop('Dialogue');
      room()?.scene.restart();
    },
    destroy() {
      touchInput.reset();
      game.destroy(false);
    },
  };
}

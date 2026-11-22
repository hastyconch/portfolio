// Vendored from the Billable. game source (src/art/palette.ts). Unchanged.
import type { Palette } from './raster';

/**
 * Shared master palette. One character = one colour, so sprites stay
 * readable as text. Per-sprite palettes may extend or override this.
 */
export const P: Palette = {
  // ink & neutrals
  k: '#1a1423', // ink / pupils
  K: '#1d1a24', // shoes, deep shadow
  i: '#ffffff', // pure white highlight
  w: '#f2f4f7', // shirt / paper white
  W: '#b4bfcc', // shirt shade
  z: '#dbe7f2', // pale paper blue
  f: '#a7b0ba', // light grey
  e: '#7d8590', // grey
  E: '#4b5260', // dark grey
  // skin & hair
  s: '#f5c9a3',
  S: '#d9976f',
  h: '#5a3825',
  H: '#82543a',
  v: '#a58bc4', // tired eye bags
  // brand
  g: '#8cc63f',
  G: '#4f8a1f',
  // cloth
  c: '#3d4558', // charcoal trousers
  C: '#282d3b',
  n: '#2b3a67', // navy
  N: '#1b2440',
  // tech
  l: '#c9d2db', // laptop aluminium
  L: '#7d8a99',
  b: '#6fd3ff', // screen glow
  u: '#3d7bd9', // blue
  U: '#24519c',
  // warm accents
  r: '#e0465a',
  R: '#9c2236',
  o: '#f08c2e',
  y: '#f5c542',
  Y: '#c98f1e',
  x: '#ff7aa8', // pink frosting
  // materials
  m: '#8a5a3b', // wood
  M: '#5e3b25',
  q: '#c8a06a', // cardboard
  Q: '#9c7646',
  a: '#59c2a8', // teal
  A: '#2f8a78',
  p: '#8e5ad6',
  P: '#5a3591',
};

export const pal = (extra: Palette = {}): Palette => ({ ...P, ...extra });

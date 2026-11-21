#!/usr/bin/env node
// Internal link check over the built site (dist/). Every href/src that points inside the site
// must resolve to a file. External links are checked by lychee in CI.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const DIST = new URL('../../dist/', import.meta.url).pathname;
if (!existsSync(DIST)) {
  console.error('✗ links: dist/ not found — run the build first');
  process.exit(1);
}

function* html(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* html(p);
    else if (n.endsWith('.html')) yield p;
  }
}

function resolves(from, url) {
  const clean = decodeURIComponent(url.split('#')[0].split('?')[0]);
  if (!clean) return true; // pure fragment
  const target = clean.startsWith('/') ? join(DIST, clean) : join(dirname(from), clean);
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(join(target, 'index.html')) || existsSync(`${target.replace(/\/$/, '')}.html`);
}

const bad = [];
let count = 0;
for (const file of html(DIST)) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(url) || url.startsWith('//')) continue;
    count++;
    if (!resolves(file, url)) bad.push(`${relative(DIST, file)} → ${url}`);
  }
}
if (bad.length) {
  console.error(`✗ links: ${bad.length} broken internal link(s)\n  ${bad.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ links: ${count} internal link(s) resolve`);

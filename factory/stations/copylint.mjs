#!/usr/bin/env node
// Copy lint (constitution art. 11): the site never uses the em dash (U+2014).
// Scans the site's source (src/) and the built output (dist/, if present) and lists every hit.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const DIRS = ['src', 'dist'].map((d) => join(ROOT, d)).filter((d) => existsSync(d));
const TEXT = /\.(astro|tsx?|jsx?|mjs|css|md|mdx|json|html|svg|txt|xml|webmanifest)$/i;
const EM_DASH = '—';

function* files(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (TEXT.test(n)) yield p;
  }
}

const hits = [];
for (const dir of DIRS) {
  for (const file of files(dir)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!line.includes(EM_DASH)) return;
      const at = line.indexOf(EM_DASH);
      const snippet = line.slice(Math.max(0, at - 40), at + 40).trim();
      hits.push(`${relative(ROOT, file)}:${i + 1}  …${snippet}…`);
    });
  }
}

if (hits.length) {
  console.error(
    `✗ copy: ${hits.length} em dash(es) found (constitution art. 11)\n  ${hits.slice(0, 40).join('\n  ')}`,
  );
  process.exit(1);
}
console.log(`✓ copy: no em dashes in ${DIRS.map((d) => relative(ROOT, d)).join(' + ')}`);

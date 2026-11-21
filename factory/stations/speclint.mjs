#!/usr/bin/env node
// Spec lint (station 1): every work order must be complete and every acceptance criterion
// must name the check that proves it. Usage: node factory/stations/speclint.mjs [WO files...]

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const SPECS = new URL('../specs/', import.meta.url).pathname;
const REQUIRED = ['id', 'title', 'phase', 'gate', 'agent', 'touches'];
const TAG = /\[(e2e:[^\]]+|axe|lighthouse|check|anonymize|links|review|owner)\]/;

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(SPECS)
      .filter((f) => /^WO-\d+.*\.md$/.test(f))
      .map((f) => join(SPECS, f));

let errors = 0;
const ids = new Set();
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const name = basename(file);
  const fail = (m) => {
    console.error(`✗ ${name}: ${m}`);
    errors++;
  };
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    fail('missing frontmatter');
    continue;
  }
  const keys = new Set([...fm[1].matchAll(/^(\w+):/gm)].map((m) => m[1]));
  for (const k of REQUIRED) if (!keys.has(k)) fail(`frontmatter missing "${k}"`);
  const id = fm[1].match(/^id:\s*(\S+)/m)?.[1];
  if (id && !name.startsWith(id)) fail(`id ${id} does not match filename`);
  if (id && ids.has(id)) fail(`duplicate id ${id}`);
  ids.add(id);
  const gate = fm[1].match(/^gate:\s*(\w+)/m)?.[1];
  if (gate && !['auto', 'human'].includes(gate)) fail(`gate must be auto|human, got ${gate}`);
  if (!/^\s+-\s+\S/m.test(fm[1].split(/^touches:/m)[1] ?? ''))
    fail('touches must list at least one path');

  const ac = src.split(/^## Acceptance criteria/m)[1]?.split(/^## /m)[0];
  if (!ac) {
    fail('missing "## Acceptance criteria" section');
    continue;
  }
  const items = ac.split('\n').filter((l) => /^\s*- \[[ x]\]/.test(l));
  if (!items.length) fail('no acceptance criteria');
  items.forEach((l) => {
    if (!TAG.test(l)) fail(`criterion has no proving check tag: "${l.trim().slice(0, 70)}"`);
  });
  if (!/^## Out of scope/m.test(src)) fail('missing "## Out of scope" section');
}

if (errors) process.exit(1);
console.log(`✓ speclint: ${files.length} work order(s) valid`);

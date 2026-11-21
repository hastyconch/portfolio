#!/usr/bin/env node
// Anonymization gate (constitution art. 3).
//
// Scans text files for banned terms (client names, program names, colleagues) and flags
// images that still carry EXIF / GPS metadata.
//
// Terms come from (merged):
//   - env BANNED_TERMS            newline- or comma-separated (GitHub secret in CI)
//   - private/banned-terms.txt    one per line, `#` comments (gitignored, local only)
//
// Findings never print the term itself (CI logs on a public repo are public) — only
// file:line and the term's index in the list. Pass --show locally to reveal it.
//
// Usage:
//   node factory/stations/anonymize.mjs [paths...]   default: src public tests factory dist README.md
//   node factory/stations/anonymize.mjs --hook       Claude Code PostToolUse hook (reads JSON on stdin)
//   ANONYMIZE_REQUIRE=1  → fail if no terms are configured (set in CI)

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;
const args = process.argv.slice(2);
const HOOK = args.includes('--hook');
const SHOW = args.includes('--show');
const paths = args.filter((a) => !a.startsWith('--'));

const TEXT_EXT = new Set([
  '.astro',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.md',
  '.mdx',
  '.json',
  '.yaml',
  '.yml',
  '.html',
  '.css',
  '.svg',
  '.txt',
  '.xml',
  '.webmanifest',
  '.map',
]);
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.heic']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'private',
  '.astro',
  '.wrangler',
  '.lighthouseci',
  'playwright-report',
  'test-results',
  'out',
]);

function loadTerms() {
  const raw = [];
  if (process.env.BANNED_TERMS) raw.push(...process.env.BANNED_TERMS.split(/[\n,]/));
  const file = join(ROOT, 'private/banned-terms.txt');
  if (existsSync(file)) raw.push(...readFileSync(file, 'utf8').split('\n'));
  return [...new Set(raw.map((t) => t.replace(/#.*/, '').trim()).filter((t) => t.length >= 2))];
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const terms = loadTerms();
// Word-ish boundaries so "Sobeys" matches "sobeys.com" but short terms don't match inside words.
const patterns = terms.map(
  (t) => new RegExp(`(?<![\\p{L}\\p{N}])${escape(t)}(?![\\p{L}\\p{N}])`, 'iu'),
);

function* walk(p) {
  if (!existsSync(p)) return;
  const st = statSync(p);
  if (st.isFile()) return yield p;
  for (const name of readdirSync(p)) {
    if (SKIP_DIRS.has(name)) continue;
    yield* walk(join(p, name));
  }
}

function hasImageMetadata(buf, ext) {
  // JPEG APP1 Exif segment, PNG/WebP eXIf chunk, or embedded XMP with GPS.
  const head = buf.subarray(0, Math.min(buf.length, 256 * 1024)).toString('latin1');
  if ((ext === '.jpg' || ext === '.jpeg') && head.includes('Exif\0\0')) return 'EXIF';
  if ((ext === '.png' || ext === '.webp') && (head.includes('eXIf') || head.includes('EXIF')))
    return 'EXIF';
  if (/GPSLatitude|exif:GPS/.test(head)) return 'GPS';
  if (ext === '.heic') return 'HEIC (convert and strip before publishing)';
  return null;
}

const findings = [];
function scanFile(file) {
  const ext = extname(file).toLowerCase();
  const rel = relative(ROOT, file);
  // The constitution, this script and the template talk *about* anonymity; scan them anyway
  // (they must not contain real names either).
  if (IMG_EXT.has(ext)) {
    const meta = hasImageMetadata(readFileSync(file), ext);
    if (meta) findings.push(`${rel}: image carries ${meta} metadata`);
    return;
  }
  if (!TEXT_EXT.has(ext) && !rel.endsWith('README')) return;
  // Filenames count too.
  patterns.forEach((re, i) => {
    if (re.test(rel))
      findings.push(
        `${rel}: filename contains banned term #${i + 1}${SHOW ? ` (${terms[i]})` : ''}`,
      );
  });
  if (!patterns.length) return;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, n) => {
    patterns.forEach((re, i) => {
      if (re.test(line))
        findings.push(`${rel}:${n + 1}: banned term #${i + 1}${SHOW ? ` (${terms[i]})` : ''}`);
    });
  });
}

let targets;
if (HOOK) {
  let input = '';
  try {
    input = readFileSync(0, 'utf8');
  } catch {
    process.exit(0);
  }
  let fp;
  try {
    const j = JSON.parse(input);
    fp = j.tool_input?.file_path ?? j.tool_input?.notebook_path;
  } catch {
    process.exit(0);
  }
  if (!fp || !existsSync(fp) || !fp.startsWith(ROOT) || fp.startsWith(join(ROOT, 'private')))
    process.exit(0);
  targets = [fp];
} else {
  targets = (paths.length ? paths : ['src', 'public', 'tests', 'factory', 'dist', 'README.md']).map(
    (p) => join(ROOT, p),
  );
}

for (const t of targets) for (const f of walk(t)) scanFile(f);

if (!terms.length) {
  const msg = 'anonymize: no banned terms configured (private/banned-terms.txt or BANNED_TERMS).';
  if (process.env.ANONYMIZE_REQUIRE === '1') {
    console.error(`✗ ${msg}`);
    process.exit(1);
  }
  if (!HOOK) console.warn(`! ${msg} Only image metadata was checked.`);
}

if (findings.length) {
  const out = `✗ anonymize: ${findings.length} finding(s) — constitution art. 3\n  ${findings.join('\n  ')}`;
  console.error(out);
  // Exit 2 in hook mode feeds stderr back to Claude so it fixes the file immediately.
  process.exit(HOOK ? 2 : 1);
}
if (!HOOK) console.log(`✓ anonymize: clean (${terms.length} term(s) checked)`);

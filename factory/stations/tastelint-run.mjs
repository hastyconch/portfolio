// Runs the vendored taste-skill copy linter (tastelint.mjs) over every built page. Its FAILs
// block (Art. 11): chatbot residue, the old slop words and stock phrases. WARN and INFO print
// with --verbose for a human to read; some are false positives on this site.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const pages = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.html')) pages.push(p);
  }
};
try {
  walk('dist');
} catch {
  /* no dist yet */
}
if (!pages.length) {
  console.error('tastelint: no pages in dist; build first');
  process.exit(2);
}
const verbose = process.argv.includes('--verbose');
const r = spawnSync(
  process.execPath,
  ['factory/stations/tastelint.mjs', ...pages, '--kind', 'service', '--json'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
if (r.status === 2 || !r.stdout) {
  process.stderr.write(r.stderr || 'tastelint: no output\n');
  process.exit(2);
}
const { files } = JSON.parse(r.stdout);
let fails = 0;
for (const f of files) {
  const shown = (f.findings ?? []).filter((x) => x.sev === 'FAIL' || (verbose && x.sev === 'WARN'));
  if (!shown.length) continue;
  console.log(`== ${f.file}`);
  for (const x of shown) {
    if (x.sev === 'FAIL') fails += 1;
    console.log(`  ${x.sev} ${x.id}: ${(x.examples ?? []).slice(0, 3).join(' | ')}`);
  }
}
console.log(
  fails
    ? `✗ tastelint: ${fails} FAIL finding(s) across ${pages.length} pages`
    : `✓ tastelint: no FAIL across ${pages.length} pages`,
);
process.exit(fails ? 1 : 0);

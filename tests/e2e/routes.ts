import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Every built page is a route under test, so new pages are covered by the gates automatically.
const DIST = join(process.cwd(), 'dist');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : n.endsWith('.html') ? [p] : [];
  });
}

export const routes = walk(DIST)
  .map(
    (f) =>
      '/' +
      relative(DIST, f)
        .replace(/index\.html$/, '')
        .replace(/\.html$/, ''),
  )
  .sort();

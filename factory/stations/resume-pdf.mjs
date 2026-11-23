#!/usr/bin/env node
// Résumé PDF (WO-024). Builds public/resume.pdf from the built home page's print view: the
// same path as "Print résumé" (the ln-print-cv class on <html>, print media), rendered with
// Playwright's page.pdf(). It is committed because the Pages build has no browser, so a hash of
// the content it is made from sits beside it.
//
//   node factory/stations/resume-pdf.mjs          regenerate (needs dist/: run the build first)
//   node factory/stations/resume-pdf.mjs --check  fail if the PDF is missing or the hash is stale
//
// The hash is sha256 over the SOURCES below, in order.

import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { copyFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const PDF = join(ROOT, 'public/resume.pdf');
const HASH = join(ROOT, 'factory/stations/resume-pdf.hash');
// WO-026: the section and this script are hashed too, so a change to the print view or the PDF
// options also marks the PDF stale.
const SOURCES = [
  'src/content/resume.json',
  'src/content/profile.json',
  'src/system/Resume.astro',
  'factory/stations/resume-pdf.mjs',
];
const [{ name }] = JSON.parse(readFileSync(join(ROOT, 'src/content/profile.json'), 'utf8'));
const TITLE = `${name}, Résumé`;

const hash = () => {
  const h = createHash('sha256');
  for (const f of SOURCES) h.update(readFileSync(join(ROOT, f)));
  return h.digest('hex');
};

if (process.argv.includes('--check')) {
  const want = hash();
  const have = existsSync(HASH) ? readFileSync(HASH, 'utf8').trim() : '';
  if (!existsSync(PDF) || statSync(PDF).size === 0) {
    console.error('✗ resume pdf: public/resume.pdf is missing. Run `npm run resume:pdf`.');
    process.exit(1);
  }
  if (have !== want) {
    console.error(
      '✗ resume pdf: stale. The content, Resume.astro or this script changed since the PDF was made. Run `npm run resume:pdf`.',
    );
    process.exit(1);
  }
  console.log('✓ resume pdf: up to date');
  process.exit(0);
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ resume pdf: dist/ not found. Run the build first.');
  process.exit(1);
}

// A tiny static server over dist/, so fonts and styles load as they do on the site.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(
    /^(\.\.[/\\])+/,
    '',
  );
  let file = join(DIST, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file.startsWith(DIST) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { port } = /** @type {import('node:net').AddressInfo} */ (server.address());

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print', colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  // Runs in the page.
  /* global document */
  // The PDF's title is the document's (no em dash, art. 11).
  await page.evaluate(async (title) => {
    document.documentElement.classList.add('ln-print-cv');
    document.title = title;
    await document.fonts.ready;
  }, TITLE);
  // Tagged (structure from the HTML, SC 1.3.1) with an outline from the headings.
  await page.pdf({
    path: PDF,
    format: 'Letter',
    margin: { top: '0.6in', bottom: '0.6in', left: '0.6in', right: '0.6in' },
    printBackground: false,
    tagged: true,
    outline: true,
  });
} finally {
  await browser.close();
  server.close();
}
writeFileSync(HASH, hash() + '\n');
// Keep the current build in step, so a preview serves the new file without rebuilding.
copyFileSync(PDF, join(DIST, 'resume.pdf'));
console.log(`✓ resume pdf: wrote public/resume.pdf (${statSync(PDF).size} bytes) and its hash`);

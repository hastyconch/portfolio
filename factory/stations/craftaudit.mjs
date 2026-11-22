// Vendored from ui-craft 0.1.0 (github.com/hastyconch/ui-craft, scripts/craft-audit.mjs, MIT).
// Update by copying the file again; don't edit here.
// ui-craft auditor: measures how consistent a codebase's CSS is, and flags patterns that make
// UI read as generated. Zero dependencies (Node 18+).
//
//   node craft-audit.mjs [paths…] [--config .craftrc.json] [--json out.json] [--ci] [--verbose]
//
// Scans .css files, plus <style> blocks in .astro/.svelte/.vue/.html. Declarations of custom
// properties (--x: …) and files listed in config "tokens" count as definitions, not usage.
// Everything else that sets a font-size, radius, shadow, duration, easing… with a literal value
// (no var()) counts towards that property's "distinct literals". Budgets cap those counts.

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter(
  (a, i) => !a.startsWith('--') && !['--config', '--json'].includes(args[i - 1]),
);

const cwd = process.cwd();
const configPath = resolve(cwd, opt('--config') ?? '.craftrc.json');
const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
const roots = (positional.length ? positional : (config.include ?? ['src'])).map((p) =>
  resolve(cwd, p),
);
const exclude = (
  config.exclude ?? ['node_modules', 'dist', '.astro', '.git', 'build', '.next']
).map((p) => p.replace(/\*\*\/?/g, '').replace(/\/$/, ''));
const tokenFiles = new Set((config.tokens ?? []).map((p) => resolve(cwd, p)));
const DEFAULT_BUDGETS = {
  fontSize: 10,
  lineHeight: 8,
  letterSpacing: 6,
  radius: 6,
  shadow: 6,
  duration: 8,
  easing: 4,
  transitionAll: 0,
  infiniteUnguarded: 0,
  hoverWithoutFocus: 0,
  pressWithoutActive: 0,
  pills: 8,
  bigBlur: 0,
};
const budgets = { ...DEFAULT_BUDGETS, ...(config.budgets ?? {}) };

// ── Collect files ───────────────────────────────────────────────────────────
const STYLE_HOSTS = new Set(['.astro', '.svelte', '.vue', '.html']);
function* walk(p) {
  const s = statSync(p);
  if (s.isDirectory()) {
    for (const n of readdirSync(p)) {
      if (exclude.some((e) => n === e || join(p, n).includes(`/${e}/`))) continue;
      yield* walk(join(p, n));
    }
  } else if (extname(p) === '.css' || STYLE_HOSTS.has(extname(p))) yield p;
}
const files = roots.filter(existsSync).flatMap((r) => [...walk(r)]);

function cssOf(file) {
  const src = readFileSync(file, 'utf8');
  if (extname(file) === '.css') return src;
  return [...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
}

// ── Minimal CSS parser: declarations with their selector and at-rule context ─
function parse(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const stack = [];
  let buf = '';
  let paren = 0;
  let quote = '';
  const flush = () => {
    const d = buf.trim();
    buf = '';
    if (!d || !d.includes(':')) return;
    const i = d.indexOf(':');
    const prop = d.slice(0, i).trim().toLowerCase();
    const value = d.slice(i + 1).trim();
    if (!/^-?-?[a-z][a-z0-9-]*$/.test(prop)) return;
    const selector = [...stack].reverse().find((p) => !p.startsWith('@')) ?? '';
    const at = stack.filter((p) => p.startsWith('@'));
    out.push({ prop, value, selector, at });
  };
  for (const ch of css) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '(') paren++;
    if (ch === ')') paren = Math.max(0, paren - 1);
    if (paren > 0) {
      buf += ch;
      continue;
    }
    if (ch === '{') {
      // A nested rule inside declarations (CSS nesting): whatever is buffered is its selector.
      stack.push(buf.trim().replace(/\s+/g, ' '));
      buf = '';
    } else if (ch === '}') {
      flush();
      stack.pop();
    } else if (ch === ';') flush();
    else buf += ch;
  }
  return out;
}

// ── Metrics ─────────────────────────────────────────────────────────────────
const norm = (v) =>
  v
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*!important/, '')
    .trim();
const usesToken = (v) => /var\(--/.test(v);
const KEYWORDS = /^(inherit|initial|unset|revert|normal|none|0|auto)$/;

const distinct = {
  fontSize: new Map(),
  lineHeight: new Map(),
  letterSpacing: new Map(),
  radius: new Map(),
  shadow: new Map(),
  duration: new Map(),
  easing: new Map(),
};
const issues = {
  transitionAll: [],
  infiniteUnguarded: [],
  hoverWithoutFocus: [],
  pressWithoutActive: [],
  pills: [],
  bigBlur: [],
};
let tokenUses = 0;
let literalUses = 0;
const hoverSelectors = [];
const focusBases = new Set();
const activeBases = new Set();

const add = (key, value, where) => {
  const m = distinct[key];
  const k = norm(value);
  if (!m.has(k)) m.set(k, []);
  m.get(k).push(where);
  literalUses++;
};
const baseOf = (sel) =>
  sel
    .replace(/:is\(([^)]*)\)/g, (_, inner) =>
      inner
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !/^:(hover|focus|focus-visible|focus-within|active)$/.test(s))
        .join(','),
    )
    .replace(/:(hover|focus-visible|focus-within|focus|active)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

for (const file of files) {
  const rel = relative(cwd, file);
  const isTokens = tokenFiles.has(file);
  for (const d of parse(cssOf(file))) {
    const where = `${rel} ${d.selector}`.trim();
    const { prop, value } = d;
    if (prop.startsWith('--')) continue; // token definitions
    if (usesToken(value)) tokenUses++;

    for (const sel of d.selector.split(',').map((s) => s.trim())) {
      if (/:hover\b/.test(sel)) hoverSelectors.push({ sel, where: rel });
      if (/:focus(-visible)?\b/.test(sel) || /:is\([^)]*:focus/.test(sel))
        focusBases.add(baseOf(sel));
      if (/:active\b/.test(sel)) activeBases.add(baseOf(sel));
    }
    if (isTokens) continue;

    if (prop === 'font-size' && !usesToken(value) && !KEYWORDS.test(value))
      add('fontSize', value, where);
    if (prop === 'line-height' && !usesToken(value) && !KEYWORDS.test(value))
      add('lineHeight', value, where);
    if (prop === 'letter-spacing' && !usesToken(value) && !KEYWORDS.test(value))
      add('letterSpacing', value, where);
    if (
      /^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/.test(prop) &&
      !usesToken(value)
    ) {
      if (!KEYWORDS.test(value) && !/^50%$/.test(value)) add('radius', value, where);
      if (/(^|\s)(999+|100)(px|vmax|rem)?\b|9999/.test(value) && !/%/.test(value))
        issues.pills.push(where);
    }
    if (prop === 'box-shadow' && !usesToken(value) && !KEYWORDS.test(value))
      add('shadow', value, where);

    if (/^(transition|animation)(-duration|-delay)?$/.test(prop)) {
      for (const m of value.replace(/var\([^)]*\)/g, '').matchAll(/(\d*\.?\d+)(ms|s)\b/g)) {
        const ms = m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1]);
        if (ms > 0.02) add('duration', `${Math.round(ms)}ms`, where);
      }
    }
    if (/^(transition|animation)(-timing-function)?$/.test(prop)) {
      const v = value.replace(/var\([^)]*\)/g, '');
      for (const m of v.matchAll(
        /cubic-bezier\([^)]*\)|\b(ease-in-out|ease-in|ease-out|ease|linear|steps\([^)]*\))\b/g,
      ))
        add('easing', m[0].replace(/\s+/g, ''), where);
    }
    if (prop === 'transition' || prop === 'transition-property') {
      // A shorthand part with no property name (starts with a time or a var()) also means "all".
      const firsts = value.split(',').map((s) => s.trim().split(/\s+/)[0]);
      const all = firsts.some(
        (f) =>
          f === 'all' ||
          (prop === 'transition' && (/^\d*\.?\d+m?s$/.test(f) || f.startsWith('var('))),
      );
      if (all) issues.transitionAll.push(`${where}  { ${prop}: ${value} }`);
    }
    if (
      (prop === 'animation' && /\binfinite\b/.test(value)) ||
      (prop === 'animation-iteration-count' && /infinite/.test(value))
    ) {
      const guarded = d.at.some((a) => /prefers-reduced-motion:\s*no-preference/.test(a));
      if (!guarded) issues.infiniteUnguarded.push(`${where}  { ${prop}: ${value} }`);
    }
    const blur = /blur\(\s*(\d+(?:\.\d+)?)px\s*\)/.exec(value);
    if ((prop === 'filter' || prop === 'backdrop-filter') && blur && parseFloat(blur[1]) >= 12)
      issues.bigBlur.push(`${where}  { ${prop}: ${value} }`);
  }
}

const PRESSABLE =
  /(button|btn|\[role=["']?button|\btab\b|-tab\b|play|toggle|chip|cta|\.pager?\b|-pg\b)/i;
for (const { sel, where } of hoverSelectors) {
  const base = baseOf(sel);
  const selfFocus = /:focus/.test(sel);
  if (!selfFocus && !focusBases.has(base)) issues.hoverWithoutFocus.push(`${where} ${sel}`);
  if (PRESSABLE.test(base) && !activeBases.has(base))
    issues.pressWithoutActive.push(`${where} ${sel}`);
}
for (const k of Object.keys(issues)) issues[k] = [...new Set(issues[k])];

// ── Report ──────────────────────────────────────────────────────────────────
const rows = [];
const over = [];
const check = (key, label, count, detail) => {
  const limit = budgets[key];
  const ok = limit === undefined || count <= limit;
  if (!ok) over.push(key);
  rows.push({ key, label, count, limit, ok, detail });
};
const LABEL = {
  fontSize: 'Distinct font-size literals',
  lineHeight: 'Distinct line-height literals',
  letterSpacing: 'Distinct letter-spacing literals',
  radius: 'Distinct border-radius literals',
  shadow: 'Distinct box-shadow literals',
  duration: 'Distinct duration literals',
  easing: 'Distinct easing literals',
};
for (const [k, m] of Object.entries(distinct))
  check(
    k,
    LABEL[k],
    m.size,
    [...m.entries()]
      .sort((a, b) => a[1].length - b[1].length) // rarest first: one-offs are the likeliest strays
      .map(([v, at]) => `\`${v}\` ×${at.length}  (${at[0]}${at.length > 1 ? ', …' : ''})`),
  );
check(
  'transitionAll',
  '`transition: all` (or no property list)',
  issues.transitionAll.length,
  issues.transitionAll,
);
check(
  'infiniteUnguarded',
  'Infinite animations without a reduced-motion guard',
  issues.infiniteUnguarded.length,
  issues.infiniteUnguarded,
);
check(
  'hoverWithoutFocus',
  ':hover rules with no :focus-visible twin',
  issues.hoverWithoutFocus.length,
  issues.hoverWithoutFocus,
);
check(
  'pressWithoutActive',
  'Pressable controls with no :active state',
  issues.pressWithoutActive.length,
  issues.pressWithoutActive,
);
check('pills', 'Pill radii (999px)', issues.pills.length, issues.pills);
check('bigBlur', 'Decorative blurs ≥ 12px', issues.bigBlur.length, issues.bigBlur);

const tokenShare =
  tokenUses + literalUses ? Math.round((tokenUses / (tokenUses + literalUses)) * 100) : 0;
const verbose = flag('--verbose');
const lines = [
  `# ui-craft audit`,
  ``,
  `${files.length} file(s) scanned · token share ${tokenShare}% (declarations using var() vs scale-relevant literals)`,
  ``,
  `| | Check | Count | Budget |`,
  `| --- | --- | --: | --: |`,
  ...rows.map((r) => `| ${r.ok ? '✓' : '✗'} | ${r.label} | ${r.count} | ${r.limit ?? '—'} |`),
];
for (const r of rows) {
  if (!r.count || (r.ok && !verbose)) continue;
  lines.push(
    '',
    `## ${r.ok ? '' : '✗ '}${r.label} (${r.count})`,
    ...r.detail.slice(0, verbose ? 200 : 25).map((d) => `- ${d}`),
  );
  if (r.detail.length > 25 && !verbose) lines.push(`- … ${r.detail.length - 25} more (--verbose)`);
}
console.log(lines.join('\n'));

const jsonOut = opt('--json');
if (jsonOut)
  writeFileSync(
    jsonOut,
    JSON.stringify({ files: files.length, tokenShare, budgets, rows, over }, null, 2),
  );

if (flag('--ci') && over.length) {
  console.error(`\n✗ craft: over budget: ${over.join(', ')}`);
  process.exit(1);
}

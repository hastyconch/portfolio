// Mobile Lighthouse budgets — constitution art. 5. Runs against the static build.
const { readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

// Audit every built page (lhci's autodiscovery skips nested pages like case studies).
function pages(dir, root = dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return pages(p, root);
    return n.endsWith('.html') ? [`http://localhost/${relative(root, p)}`] : [];
  });
}

const budgets = {
  'categories:performance': ['error', { minScore: 0.95 }],
  'categories:accessibility': ['error', { minScore: 1 }],
  'categories:best-practices': ['error', { minScore: 0.95 }],
  'categories:seo': ['error', { minScore: 0.95 }],
  'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
  'total-blocking-time': ['error', { maxNumericValue: 150 }],
  'resource-summary:script:size': ['error', { maxNumericValue: 102400 }],
};

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 1,
      url: pages('./dist'),
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 812,
          deviceScaleFactor: 2,
          disabled: false,
        },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertMatrix: [
        // The 404 page is intentionally noindex, which Lighthouse scores as an SEO failure.
        { matchingUrlPattern: '^(?!.*/404).*$', assertions: budgets },
        {
          matchingUrlPattern: '.*/404.*',
          assertions: { ...budgets, 'categories:seo': 'off' },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: 'factory/out/lighthouse' },
  },
};

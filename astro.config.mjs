// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Fully static build served by Cloudflare Pages (see wrangler.jsonc).
export default defineConfig({
  site: 'https://nakuliyer.pages.dev', // replaced by the custom domain in Phase 6
  output: 'static',
  integrations: [react()],
  build: { inlineStylesheets: 'auto' },
  vite: { build: { sourcemap: false } },
});

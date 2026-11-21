// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Fully static build served by Cloudflare Workers static assets (see wrangler.jsonc).
export default defineConfig({
  site: 'https://portfolio.example.workers.dev', // replaced once the domain is chosen (Phase 6)
  output: 'static',
  integrations: [react()],
  build: { inlineStylesheets: 'auto' },
  vite: { build: { sourcemap: false } },
});

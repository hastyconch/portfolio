---
title: TCG Companion
tagline: Find underpriced trading cards across vendors.
category: tool
year: '2026'
platforms: [Web]
problem: Card prices vary wildly between vendors. This compares singles and sealed product (English and Japanese) against market prices, flags deals and tracks a collection.
features:
  - Cross-vendor price comparison against market prices.
  - Deal alerts and a collection tracker.
planned: []
stack:
  - {
      layer: Structure,
      tech: 'pnpm monorepo',
      why: 'Web app, data ingest and shared packages in one place.',
    }
  - {
      layer: App,
      tech: 'Next.js on Cloudflare (OpenNext) · Drizzle ORM',
      why: 'Typed queries and edge hosting.',
    }
  - {
      layer: Ingest,
      tech: 'Cloudflare Worker',
      why: 'Scheduled price collection, separate from the user-facing app.',
    }
engineering:
  - {
      title: 'Spec first',
      body: 'Built from a detailed written specification before any code, the same spec-driven approach I use with clients.',
    }
demo: tcg
accent: '#1d4ed8'
order: 7
featured: false
status: ready
---

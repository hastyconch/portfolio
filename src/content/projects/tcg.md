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
cover:
  frame: browser
  backdrop: '#1d4ed8'
  image: ../../assets/projects/tcg/01-deals.webp
  alt: "Mock-up of TCG Companion's deals screen: a table of cards listed below market price, with vendor, condition and discount."
  mockup: true
gallery:
  title: 'Screens (mock-ups)'
  intro: "These are mock-ups of the app's main screens, made for this page with invented cards, vendors and prices. They are not screenshots."
  items:
    - {
        image: ../../assets/projects/tcg/02-compare.webp,
        alt: 'Mock-up of a card page: price history over thirty days and the same card across five vendor listings, cheapest first, with a deal flag.',
        caption: 'Mock-up: one card across vendors, against market price.',
        shape: full,
      }
    - {
        image: ../../assets/projects/tcg/03-alerts.webp,
        alt: 'Mock-up of deal alerts: price targets per card with on and off switches, and recent hits.',
        caption: 'Mock-up: deal alerts and recent hits.',
        shape: wide,
      }
    - {
        image: ../../assets/projects/tcg/04-collection.webp,
        alt: 'Mock-up of the collection: market value, price paid and gain, above a grid of cards with their values.',
        caption: 'Mock-up: the collection and what it is worth.',
        shape: wide,
      }
demo: tcg
accent: '#1d4ed8'
order: 4
featured: false
status: ready
---

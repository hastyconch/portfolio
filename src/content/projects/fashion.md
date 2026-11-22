---
title: Fashion Companion
tagline: What should I wear today, from the clothes I already own?
category: app
year: '2026'
platforms: [Web (installable)]
problem: I own a lot of clothes and still stand in front of the closet with no idea what to wear. This app knows my wardrobe, the weather and where I'm going, and suggests outfits in my style.
features:
  - Photograph clothes one at a time or in a batch "closet session"; AI tags each piece by category, colours, formality, warmth, season, style.
  - Duplicate detection that asks before adding the same shirt twice.
  - Three outfits a day per occasion (Easy, Balanced and Stretch) for everyday, work, evening, date, active or travel.
  - Suggestions use the live forecast for your city.
  - An eight-question style quiz and an editable AI-written style brief keep suggestions in your style; thumbs up/down feedback teaches it further.
  - Swap a piece without another AI call; log what you wore.
planned:
  - Weekly fashion-trend research, cited from leading fashion publications, feeding the stylist.
stack:
  - {
      layer: App,
      tech: 'Next.js · React · TypeScript · Tailwind (installable web app)',
      why: 'One app for phone and desktop, installable to the home screen with camera access.',
    }
  - {
      layer: AI,
      tech: 'Claude (vision + structured output)',
      why: 'Tags photos and composes outfits as validated JSON; every item it returns is checked against the real closet.',
    }
  - {
      layer: Weather,
      tech: 'Open-Meteo',
      why: 'Free, keyless forecasts and geocoding, with no API key to leak.',
    }
  - {
      layer: Data & storage,
      tech: 'Supabase (Postgres, row-level security, private storage)',
      why: "Each user's closet is private at the database and storage level.",
    }
  - {
      layer: Hosting,
      tech: 'Cloudflare Workers via OpenNext',
      why: 'Edge hosting with preview builds for every pull request.',
    }
engineering:
  - {
      title: 'Privacy on the device',
      body: 'Photos are resized to WebP in the browser, which also strips location metadata before upload.',
    }
  - {
      title: 'Database-level security, tested',
      body: 'Row-level security rules are covered by tests that run against an in-process Postgres.',
    }
demo: fashion
accent: '#9d174d'
order: 4
featured: true
status: ready
---

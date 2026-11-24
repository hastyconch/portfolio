---
title: Travel Planner
tagline: Describe a trip in your own words; get a plan you can live in.
category: app
year: '2026'
platforms: [Web, iOS (in progress)]
problem: Planning a trip to Portugal and the Azores, I wanted one place that drafts the itinerary, guides each day and settles costs with travel companions. It started as a personal tool and became a multi-user app with sign-in.
features:
  - AI trip planning from a free-text description, paced relaxed, balanced or adventurous, previewed before it's saved.
  - An AI assistant that edits the schedule on request ("Day 1 is too packed, clear my afternoon").
  - Daily dashboard with AI tips that factor in the weather forecast.
  - Day-by-day map with walking and driving routes and an AI day briefing.
  - Flight lookup by number, hotel cards with photos.
  - Group cost splitter in CAD, EUR or USD with live exchange rates, equal/full/custom splits and net settlement, fed by a companion receipt scanner.
  - Trip sharing with editor and viewer roles; sign-in with email, Google or GitHub; waitlist with admin approval.
planned:
  - Native iOS app (SwiftUI), in progress.
stack:
  - {
      layer: Web app,
      tech: 'Next.js (App Router) · React · TypeScript · Tailwind',
      why: 'Server routes keep API keys off the client; one mobile-first codebase serves phones and laptops.',
    }
  - {
      layer: AI,
      tech: 'Groq · Llama 3.3 70B (JSON mode)',
      why: 'Very fast, low-cost structured output: itineraries come back as JSON, validated before they touch the trip.',
    }
  - {
      layer: Data & auth,
      tech: 'Supabase (Postgres, row-level security, OAuth)',
      why: 'Postgres with per-row access rules, so sharing and roles are enforced in the database, not just the UI.',
    }
  - {
      layer: APIs,
      tech: 'Mapbox · Open-Meteo · Aviationstack · Unsplash · Open Exchange Rates',
      why: 'Best-of-breed services for maps, weather, flights, photos and currency instead of reinventing any of them.',
    }
  - {
      layer: Hosting,
      tech: Vercel,
      why: 'Zero-config deploys for Next.js with preview URLs on every change.',
    }
engineering:
  - {
      title: 'Never trust the model blindly',
      body: 'Every AI response is validated against a schema and filtered to the trip dates before it can change the itinerary.',
    }
  - {
      title: 'One document per trip',
      body: 'The trip is a single JSON document with debounced auto-save: simple to sync, and shareable between web and iOS.',
    }
  - {
      title: 'Receipts to settlement',
      body: 'A companion app uses Claude to read receipts line by line; its ledger imports straight into the cost splitter.',
    }
cover:
  frame: phone
  backdrop: '#1a5c44'
  slot: '01-dashboard'
  alt: 'Travel Planner on a phone: the daily dashboard.'
gallery:
  title: 'Screens'
  intro: "The app's main screens."
  items:
    - {
        slot: '01-dashboard',
        alt: "The daily dashboard: the day's plan with the forecast and AI tips.",
        caption: 'The daily dashboard, with the forecast.',
        shape: tall,
      }
    - {
        slot: '02-day-map',
        alt: 'A day on the map, with walking and driving routes between stops.',
        caption: 'A day on the map, with routes.',
        shape: tall,
      }
    - {
        slot: '03-assistant',
        alt: 'The assistant editing the schedule after a request to clear an afternoon.',
        caption: 'Asking the assistant to change the plan.',
        shape: tall,
      }
    - {
        slot: '04-costs',
        alt: 'The cost splitter: shared expenses and who owes whom.',
        caption: 'The cost splitter, settling up.',
        shape: tall,
      }
demo: travel
accent: '#1a5c44'
order: 7
featured: true
status: ready
---

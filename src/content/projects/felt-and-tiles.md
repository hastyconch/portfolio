---
title: Felt & Tiles
tagline: Learn and play Bridge and Hong Kong Mahjong.
category: game
year: '2026'
platforms: [Web]
problem: My dad plays Mahjong with his friends all the time. I built a place to learn it (and Bridge) properly, then practise against computer opponents that actually play well.
features:
  - Seven interactive lessons per game, from "meet the tiles" to reading the table.
  - Play a full table against three computer opponents at three difficulty levels, with coach hints.
  - Bridge bidding that explains every call; Mahjong scoring with around twenty faan patterns.
  - Accounts with progress, achievements, titles and cosmetic card, tile and table styles.
planned:
  - Online play with friends.
stack:
  - {
      layer: Frontend,
      tech: 'React · TypeScript · Motion',
      why: 'Card and tile animation that feels physical, on a typed game engine.',
    }
  - {
      layer: Game AI,
      tech: 'Monte-Carlo simulation · shanten/ukeire analysis',
      why: 'Hard Bridge opponents simulate possible hands; Mahjong opponents measure how close each discard keeps them to winning.',
    }
  - {
      layer: Backend,
      tech: 'Cloudflare Workers (Hono) · D1',
      why: 'A tiny edge API and SQLite database for accounts and progress.',
    }
  - {
      layer: Auth,
      tech: 'PBKDF2 passwords · HttpOnly sessions',
      why: 'Standard, dependency-free password hashing; guest progress imports on sign-up.',
    }
engineering:
  - {
      title: 'Engines without UI',
      body: 'Game rules and AI are pure TypeScript with no UI dependencies, so tests verify that tutorial answers match the engine.',
    }
demo: mahjong
accent: '#14532d'
order: 5
featured: false
status: ready
---

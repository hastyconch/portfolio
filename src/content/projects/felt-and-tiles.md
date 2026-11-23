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
cover:
  frame: browser
  backdrop: '#1f7a4d'
  image: ../../assets/projects/felt-and-tiles/01-home.webp
  alt: 'The Felt & Tiles lobby: Bridge and Mahjong side by side, each with Play and Learn the basics, above a level bar and achievements to chase.'
gallery:
  title: 'Screens'
  intro: 'Captured from the app running on my laptop, playing as a guest.'
  items:
    - {
        image: ../../assets/projects/felt-and-tiles/02-bridge-table.webp,
        alt: 'A Bridge table: partner and the opponents have passed, the note under the auction explains the last call, and the bidding box waits for your bid.',
        caption: 'Bridge: every call explained in plain English.',
        shape: wide,
      }
    - {
        image: ../../assets/projects/felt-and-tiles/03-mahjong-table.webp,
        alt: 'A Mahjong table: your fourteen tiles along the bottom, flowers set aside and three computer opponents around the wall.',
        caption: 'Mahjong against three computer opponents.',
        shape: wide,
      }
    - {
        image: ../../assets/projects/felt-and-tiles/04-lesson.webp,
        alt: 'A Mahjong lesson on the three suits, showing a row of dots, bamboo and character tiles.',
        caption: 'A lesson: the three suits, step one of seven.',
        shape: wide,
      }
    - {
        image: ../../assets/projects/felt-and-tiles/05-atelier.webp,
        alt: 'The Atelier: a preview table, animation and sound preferences, and card backs to unlock.',
        caption: 'The Atelier: card backs, faces and felt to unlock.',
        shape: wide,
      }
demo: mahjong
accent: '#14532d'
order: 2
featured: false
status: ready
---

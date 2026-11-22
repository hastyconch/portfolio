---
title: Billable.
tagline: A satirical pixel-art platformer about life in consulting.
category: game
year: '2026'
platforms: [Web]
problem: I love platformers and wanted to step outside work entirely and make one, with a story that satirizes my own career. A new hire climbs the firm's tower, fighting office supplies and managers, and discovers their Partner is setting them up to take the fall for a blown client account.
features:
  - Five stages of rooms that slide like a classic action platformer, each with its own boss.
  - Three playable classes (Associate, Rainmaker and Analyst) with distinct attacks and coffee-powered specials.
  - Eight enemies, from the Red Stapler to Reply-All, each introduced with a quip.
  - Billable Hours to collect, Leaked Emails that open story dialogue, checkpoints at the water cooler and a Pantry upgrade shop.
  - Keyboard, gamepad and touch controls; progress saved in the browser.
planned:
  - An original soundtrack (sound effects ship today; music is next).
stack:
  - {
      layer: Engine,
      tech: 'Phaser 3 (Arcade physics)',
      why: 'Battle-tested 2D engine: scenes, cameras and physics out of the box, so the work goes into feel, not plumbing.',
    }
  - {
      layer: Language,
      tech: TypeScript,
      why: 'A game is a big state machine; types catch whole classes of bugs before a playtest does.',
    }
  - {
      layer: Art,
      tech: 'Procedural pixel art',
      why: 'Every sprite is drawn in code from character grids and rasterized at boot: no image files, a tiny download and art that is diffable like code.',
    }
  - {
      layer: Audio,
      tech: ZzFX,
      why: 'A ~1 KB synth: every sound effect is a short array of parameters instead of an audio file.',
    }
  - {
      layer: Build & test,
      tech: 'Vite · Vitest · Playwright',
      why: 'Instant reloads while tuning movement; unit tests for levels and saves; headless bots that fuzz and screenshot rooms.',
    }
engineering:
  - {
      title: 'Game feel',
      body: 'Coyote time, jump buffering, variable jump height and a down-thrust pogo: the small forgiveness mechanics that make a platformer feel fair.',
    }
  - {
      title: 'Playtested with friends',
      body: 'Friends played early builds; their feedback drove a round of fixes: a stapler that reads as a stapler, gentler hazards, a longer jump.',
    }
demo: billable
accent: '#2f7d32'
order: 1
featured: true
status: ready
---

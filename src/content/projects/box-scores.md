---
title: Box Scores
tagline: A clean, mobile-first NBA scoreboard.
category: app
year: '2026'
platforms: [Web]
problem: Sports apps bury the box score under ads and video. I wanted today's games, box scores, standings and the bracket — fast and readable.
features:
  - Today's games, full box scores, schedule and teams.
  - Standings, stat leaders and the playoff bracket.
planned: []
stack:
  - {
      layer: App,
      tech: 'Next.js · React · Tailwind',
      why: 'Server rendering keeps it fast on mobile.',
    }
  - {
      layer: Data,
      tech: 'ESPN public endpoints',
      why: 'Live NBA data without running an ingestion pipeline.',
    }
  - { layer: Hosting, tech: Vercel, why: 'Push-to-deploy with previews.' }
engineering: []
demo: boxscores
accent: '#c2410c'
order: 6
featured: false
status: ready
---

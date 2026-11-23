---
title: Box Scores
tagline: A clean, mobile-first NBA scoreboard.
category: app
year: '2026'
platforms: [Web]
problem: Sports apps bury the box score under ads and video. I wanted today's games, box scores, standings and the bracket, fast and readable.
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
cover:
  frame: phone
  backdrop: '#f97316'
  image: ../../assets/projects/box-scores/01-today.webp
  alt: "Box Scores on a phone: today's NBA games, grouped into live, upcoming and final, with team records and scores."
gallery:
  title: 'Screens'
  intro: 'Captured from the app running on my laptop, on live public NBA data from a Sunday in November 2026.'
  items:
    - {
        image: ../../assets/projects/box-scores/01-today.webp,
        alt: "Today's games: one live, five upcoming with tip-off times and arenas, one final.",
        caption: "Today's games, live first.",
        shape: tall,
      }
    - {
        image: ../../assets/projects/box-scores/02-box-score.webp,
        alt: "A finished game: the final score, the linescore by quarter and each player's minutes, points and shooting.",
        caption: 'A box score: linescore, then every player.',
        shape: tall,
      }
    - {
        image: ../../assets/projects/box-scores/03-standings.webp,
        alt: 'Eastern Conference standings with wins, losses, percentage and games behind; playoff and play-in places are marked.',
        caption: 'Standings, with playoff and play-in places.',
        shape: tall,
      }
    - {
        image: ../../assets/projects/box-scores/04-leaders.webp,
        alt: 'Stat leaders: the top five in points per game, then assists per game.',
        caption: 'Stat leaders across the league.',
        shape: tall,
      }
demo: boxscores
accent: '#c2410c'
order: 3
featured: false
status: ready
---

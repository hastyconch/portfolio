---
title: This portfolio
tagline: A site built by a software factory of AI agents — with me as the product owner.
category: tool
year: '2026'
platforms: [Web]
problem: I wanted a portfolio that shows how I work, not just what I've worked on. So I ran it the way I'd run a product team with AI. I wrote a constitution and work orders with testable acceptance criteria, let AI builder agents do the building, and kept the decisions — and the sign-offs — for myself. Instead of committing to one design up front, the factory built four complete directions so I could pick the best of each.
features:
  - A written constitution — ten rules every agent is held to, from client anonymity and WCAG 2.2 AA to honest labelling of planned work.
  - Work orders in which every acceptance criterion names the automated check that proves it; a linter rejects any that don't.
  - Four full design directions — Editorial, Desktop OS, Product Spec and Liner Notes — built in parallel by separate agents, each in its own git worktree.
  - A side-by-side lab for comparing any section across all four directions at phone and desktop sizes, with a pick sheet that exported my choices.
  - Gates on every change, locally and in CI — types, lint, accessibility in light and dark mode, keyboard and reduced-motion tests, Lighthouse budgets on every page, an anonymity scan and a secret scan.
  - Guardrails that ask me before any push to production, merge or deploy, and block force-pushes and history rewrites outright.
planned:
  - Interactive demos for the rest of my work and projects (in progress).
  - Music, with annotated lyrics.
  - A custom domain.
stack:
  - {
      layer: Framework,
      tech: 'Astro (static) + React islands',
      why: 'Pages ship as plain HTML; JavaScript loads only for the interactive demos, keeping every page under its performance budget.',
    }
  - {
      layer: Content,
      tech: 'Typed content collections (Zod)',
      why: 'One content model, rendered by every design direction — so directions could be compared and mixed slot by slot.',
    }
  - {
      layer: Agents,
      tech: 'Claude Code — builder, reviewer, design-critic and accessibility agents',
      why: 'Each work order goes to a builder agent in an isolated worktree; a fresh-context reviewer checks the diff against the acceptance criteria.',
    }
  - {
      layer: Quality gates,
      tech: 'Playwright · axe-core · Lighthouse CI · ESLint · Prettier · lychee · gitleaks',
      why: 'Checks that run the same way on my laptop and in GitHub Actions, so “done” means the same thing everywhere.',
    }
  - {
      layer: Guardrails,
      tech: 'Claude Code hooks (Python)',
      why: 'Policy enforced in code rather than in a prompt: pushes, merges and deploys need my confirmation; risky git operations are blocked.',
    }
  - {
      layer: Hosting,
      tech: 'Cloudflare Pages · GitHub Actions',
      why: 'Every branch gets its own preview URL to review on my phone; merging to main deploys production.',
    }
engineering:
  - {
      title: 'Four options before one',
      body: 'Every direction had to render the same content through the same named slots. That contract is what made mixing possible: the final site takes its look, music and case studies from Liner Notes and its Work layout from Editorial.',
    }
  - {
      title: 'Picks, not opinions',
      body: 'I chose slot by slot in the lab, with a note for each pick. The picks file became the spec for the real build.',
    }
  - {
      title: 'The gates caught real problems',
      body: 'A layout shift from web fonts swapping in (fixed by preloading the fonts), a gallery that blocked the main thread by loading four previews at once (fixed by lazy loading), and a cold CI machine failing a tiny page (fixed by asserting the median of three Lighthouse runs, with the budgets unchanged).',
    }
  - {
      title: 'History kept on purpose',
      body: 'The four directions are preserved under a git tag, every work order lands as its own merge commit, and a dated decision log records each choice I made along the way.',
    }
gallery:
  title: The four directions
  intro: What the factory built for the first decision, captured as I reviewed them. Same content, same sections, four very different sites.
  items:
    - {
        image: ../../assets/making-of/lab-compare.webp,
        alt: 'The lab comparison view: the hero section of all four directions side by side at phone width.',
        caption: 'The lab: any section, all four directions, side by side.',
        shape: full,
      }
    - {
        image: ../../assets/making-of/direction-a-desktop.webp,
        alt: 'Direction A, Editorial: a magazine-style home with a large serif headline and a contents list.',
        caption: 'A — Editorial. Picked for the Work layout.',
        shape: wide,
      }
    - {
        image: ../../assets/making-of/direction-b-desktop.webp,
        alt: 'Direction B, Desktop OS: a dark desktop with app icons, info cards and a dock.',
        caption: 'B — Desktop OS.',
        shape: wide,
      }
    - {
        image: ../../assets/making-of/direction-c-desktop.webp,
        alt: 'Direction C, Product Spec: a workspace layout with side navigation and a properties panel.',
        caption: 'C — Product Spec.',
        shape: wide,
      }
    - {
        image: ../../assets/making-of/direction-d-desktop.webp,
        alt: 'Direction D, Liner Notes: an album cover with the name in large type and a vinyl record sliding out.',
        caption: 'D — Liner Notes. Picked for the look and most sections.',
        shape: wide,
      }
    - {
        image: ../../assets/making-of/direction-a-phone.webp,
        alt: 'Direction A on a phone.',
        caption: 'A on a phone.',
        shape: tall,
      }
    - {
        image: ../../assets/making-of/direction-b-phone.webp,
        alt: 'Direction B on a phone, as a home screen.',
        caption: 'B on a phone.',
        shape: tall,
      }
    - {
        image: ../../assets/making-of/direction-c-phone.webp,
        alt: 'Direction C on a phone.',
        caption: 'C on a phone.',
        shape: tall,
      }
    - {
        image: ../../assets/making-of/direction-d-phone.webp,
        alt: 'Direction D on a phone, with the album cover hero.',
        caption: 'D on a phone.',
        shape: tall,
      }
demo: none
accent: '#b4441f'
order: 8
featured: false
status: ready
---

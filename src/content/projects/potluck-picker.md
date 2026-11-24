---
title: Potluck Picker
tagline: "One link for the guests, and everyone says what they're bringing."
category: app
year: '2026'
platforms: [Web]
problem: "My mom wanted one link she could send to a group chat, where everyone writes down what they're bringing to a potluck. Her guests are older, so it does one thing and keeps it simple. Guests need no account, the text and buttons are big, and it asks one question at a time. Everyone chooses their own dish, and the app sorts and counts them, so the list shows how many starters, mains, sides and desserts are coming."
features:
  - 'The host sets up the party and gets a ready-to-send message: WhatsApp, another app, or copy.'
  - Guests tap the link, then their name. No account, no password.
  - The kind of dish is worked out from its name; the app asks only when it can't tell.
  - 'A soft duplicate check: typos and spellings as you type, then a meaning check ("lemonade" and "nimbu pani"). Guests can always add it anyway.'
  - Dishes grouped by kind with counts ("2 mains · 1 dessert"), who hasn't added anything yet, and a reminder the host can send them.
  - An AI-written card and photo for each dish. If AI is down, the dish is still added.
  - Host accounts, so the host link can't be lost.
planned:
  - Password reset by email. It is built, and switched off until the app has a domain to send from.
  - Guests adding their own photo of the dish.
stack:
  - {
      layer: Frontend,
      tech: 'React · Vite · TypeScript',
      why: 'One small app. Validation, duplicate matching and the kinds of dish are shared code, used by the page and the API alike.',
    }
  - {
      layer: Backend,
      tech: 'Cloudflare Worker (Hono) · D1 · R2 · Images',
      why: 'One Worker is the API and serves the app: D1 for data, R2 for photos, the Images binding to shrink each photo to a small WebP. No other vendors.',
    }
  - {
      layer: AI,
      tech: 'Workers AI',
      why: 'Writes each card, makes each photo and judges near-duplicates with a language model, since embeddings rated "lemonade" and "nimbu pani" less alike than two biryanis.',
    }
  - {
      layer: Front door,
      tech: 'Cloudflare Pages',
      why: 'The app gets its own address and forwards to the Worker, which has no public address of its own.',
    }
  - {
      layer: Tests,
      tech: 'Playwright · axe · Vitest in workerd',
      why: 'Phone and desktop journeys checked against WCAG 2.2 AA; API tests run in the Workers runtime with a fake AI.',
    }
engineering:
  - {
      title: "Built for one person's guests",
      body: '18px text, 48px buttons and one question per screen. The kind of dish is stated in a sentence, and guests tap their name on the guest list while the keyboard stays out of the way.',
    }
  - {
      title: 'A soft rule, not a lock',
      body: 'A near-duplicate gets a short note, and the big button still adds the dish. Two of the same is fine; nobody is blocked.',
    }
  - {
      title: 'AI is optional',
      body: 'The dish is saved first; the card and photo follow in the background. If AI fails, the dish keeps a plain card and nothing breaks.',
    }
cover:
  frame: phone
  backdrop: '#a63d17'
  image: ../../assets/projects/potluck-picker/01-board.webp
  alt: 'Potluck Picker on a phone: a Diwali potluck hosted by Meena, six guests bringing and two not yet, the dishes counted by kind (1 starter, 2 mains, 1 side, 1 dessert, 1 drink), then the starters.'
gallery:
  title: 'Screens'
  intro: 'Captured from a copy running on my laptop with AI switched off, so dishes show plain tiles. The guests are invented. The live app is at potluck-picker.pages.dev.'
  items:
    - {
        image: ../../assets/projects/potluck-picker/01-board.webp,
        alt: 'The potluck page: the date, who is coming, the dishes counted by kind, and the first dish, vegetable samosas from Priya.',
        caption: 'The list, counted by kind.',
        shape: tall,
      }
    - {
        image: ../../assets/projects/potluck-picker/02-who.webp,
        alt: 'What is your name? The guest list as big buttons, each name showing what that guest is bringing, and a box for anyone not on the list.',
        caption: 'Guests tap their name.',
        shape: tall,
      }
    - {
        image: ../../assets/projects/potluck-picker/03-dish.webp,
        alt: 'What are you bringing? Lata has typed masala chai, and the app says it will be listed under drinks, with a link to change it.',
        caption: 'The kind of dish, worked out from its name.',
        shape: tall,
      }
    - {
        image: ../../assets/projects/potluck-picker/04-duplicate.webp,
        alt: 'Lata types samosa. A calm note says Priya is already bringing vegetable samosas and two of the same is fine too; the big button says Add it anyway.',
        caption: 'A heads-up about a duplicate, never a block.',
        shape: tall,
      }
    - {
        image: ../../assets/projects/potluck-picker/05-share.webp,
        alt: 'Your potluck is ready: the invitation message with the date and the link, a Send on WhatsApp button, Copy the message, and Copy just the link.',
        caption: "The host's ready-to-send message.",
        shape: tall,
      }
demo: none
accent: '#a63d17'
order: 1
featured: true
status: ready
---

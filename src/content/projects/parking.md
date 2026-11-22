---
title: Parking Registrar
tagline: One tap to register a guest's car, instead of a ten-field form and a CAPTCHA.
category: tool
year: '2026'
platforms: [iOS, Web]
problem: "My building's visitor-parking portal is old, slow and painful on a phone: every registration means retyping codes and solving a CAPTCHA. I built a personal app that does it in one tap."
features:
  - Saved visitors with one-tap registration, plus quick one-off registration for any plate.
  - A monthly usage meter per visitor, so I never run out of passes by surprise.
  - Confirmation codes captured automatically; history grouped by month.
  - Native iOS app with Face ID lock, Siri shortcuts and haptics.
planned: []
stack:
  - {
      layer: iOS,
      tech: 'SwiftUI (personal build, installed with a developer account)',
      why: 'The nicest experience on the phone I actually use, and a private app that never needed the App Store.',
    }
  - {
      layer: Backend,
      tech: 'Next.js API route on Vercel',
      why: 'One endpoint both the iOS and web apps call; the heavy lifting stays on the server.',
    }
  - {
      layer: Automation,
      tech: 'Headless Chromium (Playwright)',
      why: 'Drives the legacy portal like a person would, in one browser session from start to finish.',
    }
  - {
      layer: AI vision,
      tech: 'Claude vision · structured output',
      why: "Reads the portal's verification image and returns exactly the characters the form expects.",
    }
  - { layer: Data, tech: Supabase, why: 'Visitors and registration history, shared by both apps.' }
engineering:
  - {
      title: 'What failed first',
      body: 'Version one chained OCR services and kept failing: the verification image is tied to the browser session. Version two keeps one real browser session from the image to the submit.',
    }
  - {
      title: 'Retries that know why',
      body: "Each response is classified as success, verification error or other error, so retries are targeted and the portal's own message comes back when it matters.",
    }
demo: parking
accent: '#4f46e5'
order: 3
featured: false
status: ready
---

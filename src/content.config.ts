// Shared content model. Every design direction renders the same collections, so the owner's
// picks can mix slots from different directions without touching content.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** `ready` = real copy; `placeholder` = owner input pending (rendered with a visible marker). */
const status = z.enum(['ready', 'placeholder']);

const profile = defineCollection({
  loader: file('src/content/profile.json'),
  schema: z.object({
    name: z.string(),
    headline: z.string(),
    intro: z.string(),
    location: z.string(),
    roleLine: z.string(),
    pillars: z.array(z.object({ title: z.string(), body: z.string() })),
    links: z.array(z.object({ label: z.string(), href: z.string() })),
    status,
  }),
});

// The music story: one entry. Constitution art. 3 covers people as well as clients, so the
// collaborator is named only when `named` is true (their consent); otherwise "a friend".
const music = defineCollection({
  loader: file('src/content/music.json'),
  schema: z.object({
    story: z.array(z.string()).min(1), // paragraphs
    releasedAs: z.string().optional(), // artist name on streaming services
    collaborator: z.object({ name: z.string(), named: z.boolean() }),
    links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
    status,
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/work' }),
  schema: z.object({
    title: z.string(),
    sector: z.string(),
    kicker: z.string(), // one-line framing for cards
    years: z.string(),
    role: z.string(),
    summary: z.string(),
    contributions: z.array(z.string()),
    outcomes: z.array(z.string()).default([]),
    skills: z.array(z.string()),
    demo: z.enum(['airline', 'grocer', 'scheduler', 'pipeline', 'none']).default('none'),
    demoFrame: z.enum(['phone', 'desktop', 'diagram', 'none']).default('none'),
    order: z.number(),
    status,
  }),
});

const stackItem = z.object({ layer: z.string(), tech: z.string(), why: z.string() });

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      category: z.enum(['app', 'game', 'tool']),
      year: z.string(),
      platforms: z.array(z.string()),
      problem: z.string(),
      features: z.array(z.string()),
      planned: z.array(z.string()).default([]), // honesty: roadmap items, labelled as planned
      stack: z.array(stackItem),
      engineering: z.array(z.object({ title: z.string(), body: z.string() })),
      demo: z.enum([
        'billable',
        'travel',
        'parking',
        'fashion',
        'mahjong',
        'boxscores',
        'tcg',
        'none',
      ]),
      accent: z.string(), // brand-ish colour for cards; must pass contrast when used for text
      order: z.number(),
      featured: z.boolean().default(false),
      // Optional process gallery (screenshots), e.g. the making-of story for this site.
      gallery: z
        .object({
          title: z.string(),
          intro: z.string(),
          items: z.array(
            z.object({
              image: image(),
              alt: z.string(),
              caption: z.string(),
              shape: z.enum(['full', 'wide', 'tall']).default('wide'),
            }),
          ),
        })
        .optional(),
      status,
    }),
});

const songs = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/songs' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: z.string(),
      art: image().optional(), // album art; the artColors gradient stands in until it arrives
      artAlt: z.string().optional(),
      credits: z.string(),
      release: z.string().optional(), // e.g. 'Single · Aug 2020 · later on the Misfits EP'
      spotify: z.string().url().optional(),
      youtube: z.string().url().optional(),
      artColors: z.tuple([z.string(), z.string()]), // gradient stand-in until album art arrives
      meaning: z.string(),
      lyrics: z.array(
        z.object({
          section: z.string().optional(), // "Verse 1", "Chorus"…
          line: z.string(),
          note: z.string().optional(), // annotation shown when the line is selected
        }),
      ),
      order: z.number(),
      status,
    }),
});

const resume = defineCollection({
  loader: file('src/content/resume.json'),
  schema: z.object({
    summary: z.string(),
    experience: z.array(
      z.object({
        org: z.string(),
        title: z.string(),
        start: z.string(),
        end: z.string(),
        bullets: z.array(z.string()),
      }),
    ),
    capabilities: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
    education: z.array(z.object({ school: z.string(), detail: z.string() })),
    status,
  }),
});

export const collections = { profile, music, work, projects, songs, resume };

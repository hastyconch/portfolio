// One call gives a direction everything it renders, already sorted. Directions must not
// hard-code copy: all text comes from src/content so picks can be mixed freely.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Profile = CollectionEntry<'profile'>['data'];
export type Work = CollectionEntry<'work'>;
export type Project = CollectionEntry<'projects'>;
export type Song = CollectionEntry<'songs'>;
export type Resume = CollectionEntry<'resume'>['data'];

const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;

export async function getSiteContent() {
  const [profile, resume, work, projects, songs] = await Promise.all([
    getEntry('profile', 'me'),
    getEntry('resume', 'resume'),
    getCollection('work'),
    getCollection('projects'),
    getCollection('songs'),
  ]);
  if (!profile || !resume) throw new Error('profile.json and resume.json are required');
  return {
    profile: profile.data,
    resume: resume.data,
    work: work.sort(byOrder),
    projects: projects.sort(byOrder),
    songs: songs.sort(byOrder),
  };
}

export type SiteContent = Awaited<ReturnType<typeof getSiteContent>>;

/** Section ids every direction must use, so /lab can deep-link one slot across directions. */
export const SLOT_IDS = {
  hero: 'hero',
  work: 'work',
  projects: 'projects',
  music: 'music',
  resume: 'resume',
  contact: 'contact',
} as const;

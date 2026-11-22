// Helpers shared by the home Music section and the /music/<id>/ pages.
import type { Music } from './content';

export function spotifyEmbed(u?: string) {
  const m = u?.match(/open\.spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : undefined;
}

export function youtubeEmbed(u?: string) {
  const m = u?.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : undefined;
}

/**
 * Constitution art. 3 covers people too: the collaborator is named only when
 * `music.collaborator.named` is true (their consent). Otherwise every mention of the name in
 * displayed copy becomes "a friend" ("my friend Sam and I" → "a friend and I").
 */
export function voice(music: Music): (text: string) => string {
  const { name, named } = music.collaborator;
  if (named || !name.trim()) return (text) => text;
  const esc = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b(?:(?:my|our) friend\\s+)?${esc}\\b`, 'gi');
  return (text) =>
    text.replace(re, (_m, offset: number, whole: string) =>
      /(^|[.!?]\s+)$/.test(whole.slice(0, offset)) ? 'A friend' : 'a friend',
    );
}

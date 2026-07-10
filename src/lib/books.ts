// Typed access to the catalogue. books.json is the single content source today,
// kept behind this module so a live repo-backed source (the Studio) can sit
// beside it later without reshaping the site.
import data from '../data/books.json';

export interface Book {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  words: number | null;
  formats: string[];
  amazon_url: string;
  cover: string | null;
  flagship: boolean;
  featured: boolean;
  status: 'published' | 'unpublished' | string;
  themes: string[];
}

export const books = data as Book[];

// Homepage-featured order is the order they appear in books.json.
export const featured = books.filter((b) => b.featured);

export const bySlug = (slug: string): Book | undefined =>
  books.find((b) => b.slug === slug);

// Honest, warm format note. Many titles are novella length: a feature, not a flaw.
export function formatNote(b: Book): string {
  const w = b.words ?? 0;
  const single = w > 0 && w < 30000;
  const len = single ? 'a single-sitting read' : 'a full-length read';
  const count = w ? `${w.toLocaleString('en-GB')} words` : '';
  const fmts = b.formats.join(' and ');
  return [count && `${count},`, len, fmts && `. Available as ${fmts}.`]
    .filter(Boolean)
    .join(' ')
    .replace(' .', '.');
}

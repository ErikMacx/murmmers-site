// Typed access to the catalogue. books.json is the single content source today,
// kept behind this module so a live repo-backed source (the Studio) can sit
// beside it later without reshaping the site.
import data from '../data/books.json';

export interface Book {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  // A jacket line, and the back-cover copy as its own paragraphs. The book
  // page prefers `blurb` when it is present; `description` stays a single
  // clean paragraph for the meta tag and the cards.
  tagline?: string;
  blurb?: string[];
  words: number | null;
  formats: string[];
  // A full Amazon URL, used only when a book needs a link the ASIN cannot
  // build. Normally leave this empty and fill in the ASINs below instead.
  amazon_url: string;
  // Amazon's own identifiers, from the publisher's ISBN Records sheet. Stored
  // rather than a built URL so the storefront can be changed in one place.
  asin_ebook?: string;
  asin_paperback?: string;
  asin_hardcover?: string;
  // Direct ebook sale. Payhip is merchant of record, so it carries the UK/EU
  // VAT on digital goods and delivers the file. Empty until the product exists.
  payhip_url: string;
  // Retail prices per format, from the publisher's sheet. Recorded so the shop
  // has them; no page displays a price today.
  prices?: Record<string, { usd: number; gbp: number }>;
  published_on?: string;
  cover: string | null;
  flagship: boolean;
  featured: boolean;
  // The publisher decides what the shop window holds. The rest of the corpus
  // keeps its record here and switches on per book, once it has a real cover
  // and a real description.
  on_site: boolean;
  status: 'published' | 'unpublished' | string;
  themes: string[];
  // Books that belong to a sequence point back at their series page.
  series?: { name: string; url: string };
  // Per-book copy for the unpublished state, so the template stays generic.
  coming_soon?: { eyebrow: string; note: string };
}

export const books = data as Book[];

// A book is only PUBLIC once the publisher has switched it on AND it has the
// copy and cover to stand up. The catalogue is synced from the press repo and
// grows whenever a title is registered, long before anyone has written its
// description or made its cover, so both halves of this guard earn their keep.
export const listed = books.filter(
  (b) => b.on_site && b.description?.trim() && b.cover,
);

// "Where to begin" is the shop window: the books a reader can actually buy
// today, in the order they appear in books.json.
export const featured = listed.filter((b) => b.featured);

// Published, and coming soon, kept apart so the catalogue never blurs a book
// you can buy with a book you cannot.
export const published = listed.filter((b) => b.status === 'published');
export const forthcoming = listed.filter((b) => b.status !== 'published');

// A count in words, capitalised, for copy that states how many books are out.
// Counted from the catalogue at build time: a hand-typed number here went
// stale the week the list grew.
const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
export const countWord = (n: number): string => NUMBER_WORDS[n] ?? String(n);

export const bySlug = (slug: string): Book | undefined =>
  books.find((b) => b.slug === slug);

// The buy buttons go through /go/amazon/<ASIN>, which sends each reader to
// their own country's Amazon store (functions/go/amazon/[asin].ts). Amazon
// offers no neutral link that does this, and a Kindle account can only buy
// from its home store, so a single fixed domain loses every reader outside it.
//
// The ebook ASIN is the link to use: on a KDP title with linked editions, that
// page carries the format strip, so a paperback buyer lands one click away.
export function amazonUrl(b: Book): string {
  if (b.amazon_url) return b.amazon_url;
  const asin = b.asin_ebook || b.asin_paperback || b.asin_hardcover;
  return asin ? `/go/amazon/${asin}` : '';
}

// Honest, warm format note. Many titles are novella length: a feature, not a flaw.
export function formatNote(b: Book): string {
  const w = b.words ?? 0;
  const single = w > 0 && w < 30000;
  const len = single ? 'a single-sitting read' : 'a full-length read';
  const count = w ? `${w.toLocaleString('en-GB')} words` : '';
  const fmts = b.formats.length > 1
    ? `${b.formats.slice(0, -1).join(', ')} and ${b.formats.at(-1)}`
    : b.formats.join('');
  return [count && `${count},`, len, fmts && `. Available as ${fmts}.`]
    .filter(Boolean)
    .join(' ')
    .replace(' .', '.');
}

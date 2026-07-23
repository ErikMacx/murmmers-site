// Public sitemap. Lists the storefront routes only; the private /studio route
// and the 404 are deliberately excluded.
import type { APIRoute } from 'astro';
import { books } from '../lib/books';

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() ?? 'https://murmmers.com/').replace(/\/$/, '');
  const routes = [
    '/',
    '/books/',
    '/about/',
    '/how-we-work/',
    '/the-waking/',
    ...books.map((b) => `/books/${b.slug}/`),
  ];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map((r) => `  <url><loc>${base}${r}</loc></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};

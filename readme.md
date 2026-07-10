# Murmmers site

The public face and storefront of Murmmers Press, at murmmers.com. Astro, static output, deployed on Cloudflare Pages from `main`.

House style everywhere, including code comments, commit messages and site copy: en-GB spelling, no em dashes, sentence-case headings.

## Data

The catalogue is seeded from the pipeline repo's `books/MANIFEST.md` into `src/data/books.json`. The press repo at `~/murmmers/murmmers-press` is read-only reference; the site reads only the manifest and cover images, never `manuscript/` directories. `books.json` is the single content source today, kept separable so a live repo-backed source can sit beside it later for the Studio.

Covers live in `src/assets/covers/`, with provenance in `src/data/covers-provenance.json`.

## Develop

```
npm install
npm run dev      # local preview
npm run build    # static build into dist/
```

## Deploy

Cloudflare Pages is connected to `main` with the Astro preset (build `npm run build`, output `dist`). A push to `main` auto-deploys to murmmers.com and www.murmmers.com.

## Roadmap

- v1 storefront: home, catalogue, book pages, about, newsletter capture, 404, sitemap, robots, favicon, OG images.
- v1.5: Payhip direct-purchase embeds and a configured email provider.
- Studio v1: a private control panel behind Cloudflare Access, rendering pipeline state from the press repo (production-line map, per-book screen, author-intent writing surface, gates queue with lettered sub-gates, daily digest, calendar, sales panels), with a thin Cloudflare Pages Functions layer for repo reads and writes using a scoped token held as a Cloudflare secret.
- Studio v2: the fuller control surface.

The `/studio` route is reserved. The internal production-line map (`public/studio/production-line.html`) is the reference artefact; its BOOKS and STAGES data shape is the contract the Studio preserves, and its gates run G1 to G8.

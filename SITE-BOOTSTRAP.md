# Murmmers site: bootstrap brief for Claude Code

You are building v1 of murmmers.com, the public face and storefront of Murmmers Press, an independent publishing house for fiction with a healing element. Work in ~/murmmers/murmmers-site/. The pipeline repo at ~/murmmers/murmmers-press/ is read-only reference: its CLAUDE.md (constitution) governs house style here too, and its books/MANIFEST.md is the catalogue source of truth.

House style everywhere, including code comments, commit messages and all site copy: en-GB spelling, no em dashes, sentence-case headings.

## Stack

- Astro, static output, no server runtime
- Deployed on Cloudflare Pages via GitHub (repo: ErikMacx/murmmers-site, private; the publisher will connect Pages to it)
- No heavy frameworks; islands only if genuinely needed. Plain CSS or a light utility layer; fast, accessible, semantic HTML
- Zero client-side tracking in v1

## v1 scope

1. Home: the press in one screen. Name, one-line identity, featured books (the flagship leads from the manifest), a quiet email signup, and a short passage of press voice. No carousel, no clutter.
2. Catalogue (/books): all 20 books from a data file seeded from the manifest (see data model). Cover, title, one-line description, link to the book page.
3. Book pages (/books/<slug>): cover, title, description, word-count-honest format note (many titles are novella length; present this as a feature: single-sitting reads), and buy links. v1 buy link is the Amazon listing; include a visually distinct but disabled or "coming soon" direct-purchase slot that Payhip will fill later. JSON-LD Book schema per page.
4. About: the press, the author in brief, and the imprint's spirit. Include one footer-level line site-wide: "Murmmers Press, sometimes searched as Murmurs Press" (the SEO catch; never apologise for the name).
5. Newsletter capture: a simple email form. If no provider is configured yet, build the form against a placeholder action and clearly mark the TODO; do not invent a provider.
6. 404, sitemap, robots, favicon, OG images (a simple generated template per book using the cover is fine).

## Data model

- src/data/books.json (or an Astro content collection): slug, title, subtitle, description (placeholder text clearly marked for the publisher to replace), words, formats, amazon_url (placeholder until the publisher supplies ASINs), cover path, flags (flagship or not), themes.
- Seed it by parsing ~/murmmers/murmmers-press/books/MANIFEST.md. Do not modify anything in the press repo.
- Covers: source JPG covers exist in the Vellum export folders (Apple Books and Kindle subfolders carry cover JPGs). Copy the best available cover per book into this repo's assets, recording provenance in a comment or manifest. Where no cover JPG exists, extract the cover image from the Generic EPUB. Flag any book with no recoverable cover.

## Design direction

Calm, literary, warm. Typography-led: a characterful serif for titles, a quiet readable face for body, generous whitespace, restrained palette (warm neutrals, one deep accent). The feeling is a small press you trust, not a tech product. No stock imagery, no gradients-and-glassmorphism, no AI-slick. The books' covers provide the colour; the site stays quiet around them. Mobile-first; the catalogue must be beautiful on a phone.

## Explicitly out of scope for v1

Payhip checkout integration (slot reserved only); BookFunnel delivery; bundles; blog; reviews; analytics; the avatar/video content; anything requiring a paid service the publisher has not confirmed.

## Execution order, stopping for review at each step

a. Scaffold the Astro project, seed books.json from the manifest, gather covers, and show me: the data file, the cover inventory (including any flagged gaps), and the proposed site map. STOP.
b. On approval: build the site. Show me the running dev preview instructions and the full page inventory. STOP.
c. On approval: git init locally if needed, but note the remote ErikMacx/murmmers-site already exists with a single README commit on main; pull or clone it first so history builds on it. Commit in sensible increments and push to main. Cloudflare Pages is already connected to main with the Astro preset (build: npm run build, output: dist): the push auto-deploys to murmmers.com and www.murmmers.com. STOP after the push and confirm the deploy went green.

## Definition of done

Site builds clean; all 20 books present with covers or flagged gaps; placeholders (descriptions, Amazon URLs, newsletter action) clearly marked and listed in a single PLACEHOLDERS.md for the publisher; pushed; Cloudflare deploy green; murmmers.com serving the site.

## Addendum: the Studio (do not build in v1; architect for it)

This site will grow a second, private surface later: the Studio, a control panel rendering pipeline state from the press repo. Its eventual screens: the production line map (live from books/*/STATE.md), a per-book screen, an author-intent writing surface that commits intent.md via the GitHub API, a gates queue with approve buttons (including lettered sub-gates, e.g. G6(a) proof, G6(b) cover, G6(c) price), the daily digest, the calendar, and sales panels. It will sit behind Cloudflare Access, with a thin Cloudflare Pages Functions layer for repo reads and writes using a scoped token held as a Cloudflare secret.

Build none of it in v1. But architect for it:
- Keep the data layer cleanly separated: books.json is the only content source today, designed so a live repo-backed source can sit beside it later without reshaping the site.
- Reserve the /studio route (a simple placeholder page is fine).
- Avoid any choice that assumes the site is forever fully static.
- Record this roadmap (v1 storefront → v1.5 Payhip embeds and email provider → Studio v1 → Studio v2) in the repo README.

A reference artefact exists: the internal production-line map (murmmers-production-line.html), a self-contained HTML flow of all stages, gates G1 to G8, and per-book chips, with a BOOKS/STAGES data shape the Studio should preserve. If the publisher provides the file, keep it under /studio as the placeholder's linked preview; treat its data shape as the contract.

## Deployment context (current reality)

- Remote: github.com/ErikMacx/murmmers-site, private, one README commit on main.
- Cloudflare Pages: project murmmers-site connected to main; Astro preset saved; first build failed harmlessly (no project yet); next push builds for real.
- Domains: murmmers.com and www.murmmers.com attached to the Pages project, certificates issuing.
- The press repo at ~/murmmers/murmmers-press is read-only reference; never commit anything into it from this session, and never let site tooling read manuscript/ directories: the site needs only MANIFEST.md and cover images.

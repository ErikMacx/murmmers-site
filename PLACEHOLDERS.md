# Placeholders

Everything on the site that is stand-in and needs the publisher before v1 can be called finished. One list, kept current.

## Content the publisher must supply

- **Book descriptions** (19 of 23): `src/data/books.json` carries a marked placeholder per book. Each needs a one-line description in press voice. Written so far: The Petrosphere's Odyssey and the three Waking books.
- **Amazon listing URLs** (19 published books): `amazon_url` is empty pending ASINs. Each book page's Amazon buy link is inert until these land. The Petrosphere's Odyssey is excluded (see below).
- **Themes** (all 20): `themes` is an empty array per book, for the publisher to fill.

## Covers

- **The Petrosphere's Odyssey, interim cover**: the Vellum export carries no cover image, so the cover shown is page one of the source Print PDF (`~/Documents/ALL COMPLETE VELLUM BOOKS/The Petrosphere's Odyssey/Print/The-Petrospheres-Odyssey-Print-2026-07-08.pdf`), rendered at 1035x1600 with qlmanage. It is a stand-in only; a proper cover replaces it through the stage 50 cover workstream.
- All other 19 covers are the best available export JPG per book (provenance in `src/data/covers-provenance.json`).

## Services not yet configured

- **Newsletter provider**: the signup form posts to a placeholder action (`/newsletter-todo`). No provider is invented. Wire the real action, and double opt-in, when the provider is chosen.
- **Direct purchase (Payhip)**: a visually distinct disabled "coming soon" slot is reserved on each published book page for v1.5.
- **Studio access**: resolved. `/studio` (and the production-line map under it) is live and gated by Cloudflare Access on both `murmmers.com` and `www.murmmers.com`; verified that the map is not reachable without login. Keep the Allow policy scoped to your email.
- **OG images**: each book page uses its cover as the Open Graph image. A composed OG card (cover plus title) can replace this later.

## Rulings recorded (not oversights)

- **Homepage features five**: The Petrosphere's Odyssey, Welcome Home, Spiral MasterWorks, Cathedral, Coherence. **The Healing is deliberately not featured on the homepage**, though it is a flagship-tier lead. Reason: a second, distinct book also titled The Healing launches later this year, and the two must not blur in the shop window. The Healing remains in the full catalogue.
- **The Petrosphere's Odyssey is unpublished**: finalised but never released, and it is the press's launch title. Its book page carries no Amazon link and no buy buttons. It gets a "coming soon, be first to read it" invitation with the email signup, framed as an invitation, not an apology.

## Draft copy and design choices

- **Site copy**: the About page, the homepage press-voice passage, and the one-line identity (meta and OG description) are final, supplied by the publisher. Still draft: the home hero headline ("Fiction with a healing element") and its subtitle, and the footer descriptor line, which the publisher may want to align with the new positioning.
- **Fonts**: v1 uses a system serif stack (Hoefler Text, Iowan Old Style, Georgia) so the site stays fast and free of external requests. Self-hosting a characterful serif such as Fraunces for titles and Newsreader for body is an easy upgrade later if you want more character.

## Decisions still open

- **The trilogy, Book 3 copy depth**: the site description for The Persistence of Memory deliberately stops at "That is the problem." The locked Gate 2 back cover goes further (the flashes, the room, the count) because it assumes a reader who has finished Book 2, and the catalogue cannot assume that: a stranger can open Book 3's page first. Revisit at Gate 7, when the sequence is real and there is a Book 3 buyer to serve. Full approved copy lives in the press repo at `books/_the-waking-trilogy/gate2-blurbs-two-audience.md`.
- **The trilogy on the homepage**: not in the featured row. "Where to begin" carries five flagships with covers; three coverless cards would thin it. Open question whether the trilogy gets a band of its own on the homepage once covers exist.

## Superseded rulings

- **The trilogy enters books.json at production** (ruled 2026-07-21). SUPERSEDED 2026-07-23 by publisher instruction: the trilogy goes into the public catalogue now, as three coming-soon titles. Beyond the Pale, Pauper's Weatherglass and The Persistence of Memory are in books.json with `status: unpublished`, `cover: null` (covers still held per intent, so each shows the title fallback frame), copy cut down from the locked Gate 2 blurbs, and a series link to /the-waking. The original reasoning stands as the reason there is still no cover, no price and no buy path on those pages.

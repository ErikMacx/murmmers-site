# Placeholders

Everything on the site that is stand-in and needs the publisher before it can be called finished. One list, kept current. Last rebuilt 2026-08-13, when the site was brought back into line with what is actually on sale.

## Blocking: the site says "soon" where it should say "buy"

Four books are live in the world, and every one of them has two dead buy buttons on murmmers.com. Both need one link per book, pasted into `src/data/books.json`.

- **ASINs (3 books)**: The Petrosphere Odyssey is DONE, wired 2026-08-13 from the publisher's ISBN Records sheet (ebook B0HBWV4CKP), and its Amazon button is live. The Honest Pilgrim, Coherence and Welcome Home have no ASIN in the sheet, so their buttons still read "Amazon listing coming soon" on books that have been on sale for weeks. Read the three off the live listings and put them in `asin_ebook`.
- **`payhip_url` (4 books)**: the direct ebook sale. Payhip was chosen 2026-08-13 because it is merchant of record, so it carries UK and EU VAT on digital goods and delivers the file. Create one product per book, paste the link, and the button lights up. Ebook prices are already recorded per book, so pricing the products is a copy job: £6.99 Petrosphere, £4.99 Honest Pilgrim, £6.99 Coherence, £4.50 Welcome Home.

**Which Amazon storefront**: `AMAZON_DOMAIN` in `src/lib/books.ts` is set to `www.amazon.co.uk`. The press is UK registered, but .com is the larger market and Amazon has no neutral link that sends a reader to their own store. It is one constant, so the whole site moves together if the sales split says otherwise.

## Services not yet configured

- **MailerLite**: chosen 2026-08-13. Nothing is wired yet. Set `MAILERLITE_KEY` in the Pages project and signups go straight to the list. Until then `/api/subscribe` emails each signup to the press so no address is lost, but that is a stopgap, not a mailing list. Turn on double opt-in before the first campaign.
- **Cloudflare Email Sending**: both `/api/feedback` and `/api/subscribe` need it. Once only: `npx wrangler email sending enable murmmers.com`, then set `FEEDBACK_TO` in the Pages project to the address that should receive reader notes. Onboarding adds DKIM records and asks for an SPF include. **The zone already carries NameCheap's forwarding SPF, so the include must be added to the existing record, never replace it, or inbound mail forwarding breaks.**
- **Studio access**: resolved. `/studio` and the production-line map are live behind Cloudflare Access on both hosts. Keep the Allow policy scoped to your email.
- **OG images**: each book page uses its cover as the Open Graph image. A composed OG card (cover plus title) can replace this later.

## Content the publisher may still want to supply

- ~~Prices: recorded nowhere.~~ FOUND 2026-08-13. All twelve (four books, three formats) were in the publisher's ISBN Records sheet and are now in `books.json` under `prices`, in USD and GBP, verified by reading the sheet directly. **No page displays a price**: that would be a new outward-facing decision and has not been taken. They are stored for Payhip and for ad bidding.
- **Themes**: `themes` is an empty array on every book. Unused by any page at present.
- **Book descriptions for the back catalogue**: nineteen titles are held off the site until each has one. See below.

## Rulings recorded (not oversights)

- **The shop window is four books** (publisher, 2026-08-13). "Where to begin" on the homepage carries exactly the four published titles: The Petrosphere Odyssey, The Honest Pilgrim, Coherence, Welcome Home. Spiral MasterWorks and Cathedral were removed from it.
- **The back catalogue is held, not deleted** (publisher, 2026-08-13). Nineteen titles come off the public site until each has a real cover and a real description, then return one at a time. Their records are intact in `books.json` behind `on_site: false`, and their old URLs 302 to `/books/` rather than 404. Nothing was thrown away.
- **The Waking trilogy is public as coming-soon**, with its signed covers, since 2026-08-13. The earlier ruling that covers were held for Gate 2 is superseded: Gate 6(b) is signed and the publisher asked for the images on the site rather than empty frames.
- **The Healing is deliberately absent.** A second, distinct book also called The Healing is due, and the two must not blur. It is not in the four, and it is among the nineteen held back.
- **Cover frames are 5:8, not 2:3.** Every finished Murmmers cover is 1600x2560. The old 2:3 frame cropped the imprint line off the foot of each one.

## Superseded

- **The Petrosphere Odyssey is unpublished, no buy links, coming-soon invitation** (ruled 2026-07). Wrong since roughly 2026-07-25 and corrected 2026-08-13: it has been on sale in all three formats for weeks. Its interim cover, page one of the print PDF, is also gone, replaced by the real one.
- **Homepage features five** (ruled 2026-07). Superseded by the four-book ruling above.
- **Book descriptions, 19 of 23 are placeholders** (recorded 2026-07). Still true of the back catalogue, but no longer visible: all four live books and all three trilogy books now carry real copy, drawn from approved back-cover text and copy banks in the press repo.

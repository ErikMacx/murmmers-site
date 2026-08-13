#!/usr/bin/env python3
"""Sync src/data/books.json from the canon, preserving everything site-owned.

The press repo is the single source of truth. The site is a view of it. This
keeps them honest without flattening the difference between them, because
books.json holds two kinds of field:

  CANON      slug, title, words, chapters, pages, status, formats, isbns.
             Owned by books/<slug>/book.json and STATE.md in the press repo.
             Overwritten here every run.

  SITE       description, cover, amazon_url, flagship, featured, themes,
             coming_soon, and any other marketing copy. Owned by the site.
             Never touched.

A book in the canon but missing from the site is added with empty site fields
and reported, so a new title cannot silently fail to appear. A book on the site
but not in the canon is left alone and reported, never deleted.

Run before a deploy:  python3 scripts/sync-canon.py
"""

import json
import os
import re
import sys

SITE = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
DATA = os.path.join(SITE, "src", "data", "books.json")

# The press repo has two working clones, and they have diverged:
#   ~/murmmers/murmmers-press      branch main, pushes to coherence-main.
#                                  Carries the production work: covers, wraps,
#                                  the ISBN register, the four live books.
#   ~/Documents/GitHub/murmmers    branch uplift-cowork-pilot. Carries the
#                                  Waking editorial line, and is the ONLY clone
#                                  holding the book.json canon files this
#                                  script reads.
# So the canon path below is the second one by necessity, not by choice, and it
# cannot see any production state recorded in the first. Until the clones are
# reconciled, treat a sync as partial and check state/PIPELINE-STATE.md in the
# production clone before trusting a status field.
PRESS = os.path.expanduser(os.environ.get("MURMMERS_PRESS", "~/Documents/GitHub/murmmers"))

CANON_FIELDS = ("title", "subtitle", "words", "chapters", "pages", "status",
                "formats", "isbn_ebook", "isbn_paperback", "isbn_hardcover",
                "stage")


def state_field(book_dir, name):
    path = os.path.join(book_dir, "STATE.md")
    if not os.path.exists(path):
        return ""
    with open(path, encoding="utf-8") as f:
        for line in f:
            if re.match(r"\s+log:", line):
                break
            m = re.match(rf"\s+{name}:\s*(.*)", line)
            if m:
                return m.group(1).strip()
    return ""


def read_canon():
    books = {}
    root = os.path.join(PRESS, "books")
    for slug in sorted(os.listdir(root)):
        d = os.path.join(root, slug)
        rec = os.path.join(d, "book.json")
        mf = os.path.join(d, "manuscript", "manifest.json")
        if not (os.path.exists(rec) and os.path.exists(mf)):
            continue
        r = json.load(open(rec, encoding="utf-8"))
        m = json.load(open(mf, encoding="utf-8"))
        pub = r.get("published") or {}
        formats = [k for k, v in pub.items() if v]
        books[slug] = {
            "title": r.get("title", ""),
            "subtitle": r.get("subtitle", ""),
            "words": sum(c["words"] for c in m["chapters"]),
            "chapters": len(m["chapters"]),
            "pages": r.get("page_count"),
            "status": "published" if formats else "unpublished",
            "formats": formats or ["ebook", "paperback"],
            "isbn_ebook": r.get("isbn_ebook", ""),
            "isbn_paperback": r.get("isbn_paperback", ""),
            "isbn_hardcover": r.get("isbn_hardcover", ""),
            "stage": state_field(d, "stage"),
        }
    return books


def main():
    canon = read_canon()
    site = json.load(open(DATA, encoding="utf-8"))
    by_slug = {b["slug"]: b for b in site}

    changed, added, orphaned, conflicts = [], [], [], []

    for slug, c in canon.items():
        if slug not in by_slug:
            # New titles arrive switched OFF. A book joins the public site only
            # when the publisher says so and it has a real cover and copy.
            entry = {"slug": slug, **c, "description": "", "cover": "",
                     "amazon_url": "", "payhip_url": "", "flagship": False,
                     "themes": [], "featured": False, "on_site": False}
            site.append(entry)
            by_slug[slug] = entry
            added.append(slug)
            continue
        b = by_slug[slug]
        for k in CANON_FIELDS:
            if k not in c or b.get(k) == c[k]:
                continue
            new, old = c[k], b.get(k)

            # The canon is not always richer than the site. Three guards, each
            # found by a dry run that would otherwise have destroyed good data:

            # 1. Never blank a value the site has filled in. The canon mashes
            #    title and subtitle together for some books; the site splits
            #    them properly.
            if (new in ("", None, [])) and old not in ("", None, []):
                conflicts.append(f"{slug}.{k}: canon is empty, site has "
                                 f"{old!r} — site kept")
                continue

            # 2. Never un-publish. The site knows about listings the repo has
            #    not recorded yet. Publication can only ever be promoted here.
            if k == "status" and old == "published" and new != "published":
                conflicts.append(f"{slug}.status: site says published, canon "
                                 f"does not — site kept, record needs its "
                                 f"published dates")
                continue

            # 3. Do not overwrite a split title with a mashed one.
            if k == "title" and b.get("subtitle") and new.startswith(old):
                conflicts.append(f"{slug}.title: canon {new!r} folds in the "
                                 f"subtitle — site kept")
                continue

            # 4. A book that is ON SALE is described by its listing, not by a
            #    canon clone that has not caught up. Found by a dry run that
            #    would have dropped hardcover from all four live books and put
            #    Welcome Home back to its first-edition page count.
            if b.get("status") == "published" and k in ("formats", "pages",
                                                        "words", "chapters"):
                conflicts.append(f"{slug}.{k}: {slug} is on sale; canon says "
                                 f"{new!r}, site says {old!r} — site kept")
                continue

            changed.append(f"{slug}.{k}: {old!r} -> {new!r}")
            b[k] = new

    for slug in by_slug:
        if slug not in canon:
            orphaned.append(slug)

    dry = "--dry-run" in sys.argv
    if not dry:
        json.dump(site, open(DATA, "w", encoding="utf-8"),
                  indent=2, ensure_ascii=False)

    print(f"\n  canon: {len(canon)} books · site: {len(site)} entries\n")
    for c in changed[:30]:
        print(f"  ~ {c}")
    if len(changed) > 30:
        print(f"  ... and {len(changed) - 30} more")
    for s in added:
        print(f"  + ADDED {s} — needs description and cover before it shows well")
    for s in orphaned:
        print(f"  ! {s} is on the site but not in the canon (left alone)")
    for c in conflicts:
        print(f"  ! {c}")
    verb = "would update" if dry else "updated"
    print(f"\n  {len(changed)} field(s) {verb}, {len(added)} added, "
          f"{len(orphaned)} orphaned, {len(conflicts)} conflict(s) where the "
          f"site was kept")
    print(f"  reads:  {PRESS}")
    print(f"  writes: {DATA}" + ("   [DRY RUN, nothing written]" if dry else "") + "\n")
    if added:
        print("  Now run: python3 scripts/build-studio-data.py\n")


if __name__ == "__main__":
    main()

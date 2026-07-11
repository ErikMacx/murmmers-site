#!/usr/bin/env python3
"""Refresh the studio production-line map from live pipeline state.

Local maintenance tool (run on the Mac before pushing). Reads each book's stage
from the press repo's books/<slug>/STATE.md and rewrites the BOOKS data inside
public/studio/production-line.html, and corrects the gate numbers to the current
G1 to G8 scheme. This is the stopgap until the Studio reads STATE.md live.

The site build never runs this; it reads only STATE.md (not manuscript) from the
read-only press repo.
"""
import json, os, re

SITE = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
PRESS = os.path.expanduser("~/murmmers/murmmers-press")
HTML = os.path.join(SITE, "public", "studio", "production-line.html")

books = json.load(open(os.path.join(SITE, "src", "data", "books.json"), encoding="utf-8"))

entries = []
for b in books:
    slug = b["slug"]
    stage = "00-INTAKE"
    state_path = os.path.join(PRESS, "books", slug, "STATE.md")
    if os.path.exists(state_path):
        m = re.search(r"^\s*stage:\s*(\S+)", open(state_path, encoding="utf-8").read(), re.M)
        if m:
            stage = m.group(1)
    entries.append((slug, b["title"], stage, bool(b.get("flagship"))))

rows = ["const BOOKS = ["]
for slug, title, stage, flagship in entries:
    flag = ", flagship:true" if flagship else ""
    rows.append(f"  {{slug:{json.dumps(slug)}, title:{json.dumps(title)}, stage:{json.dumps(stage)}{flag}}},")
rows.append("];")
new_books = "\n".join(rows)

html = open(HTML, encoding="utf-8").read()
html, n = re.subn(r"const BOOKS = \[.*?\];", new_books, html, count=1, flags=re.S)
if n != 1:
    raise SystemExit("could not find the BOOKS block to replace")

# Correct gate numbers to the amended G1 to G8 scheme (idempotent).
gate_fixes = [
    ('{no:"G0", name:"intent approved"}',      '{no:"G1", name:"intent approved"}'),
    ('{no:"G1", name:"triage: tier + depth"}', '{no:"G2", name:"triage: tier + depth"}'),
    ('{no:"G2", name:"fingerprint approved"}', '{no:"G3", name:"fingerprint approved"}'),
    ('{no:"G3", name:"manuscript approved"}',  '{no:"G4", name:"manuscript approved"}'),
    ('{no:"G3b", name:"text lock"}',           '{no:"G5", name:"text lock"}'),
    ('{no:"G4", name:"proof, cover, price"}',  '{no:"G6", name:"proof, cover, price (a/b/c)"}'),
    ('{no:"G5", name:"go / no-go"}',           '{no:"G7", name:"go / no-go"}'),
    ('{no:"G6", name:"pivot (flagships)"}',    '{no:"G8", name:"pivot (flagships)"}'),
]
for old, new in gate_fixes:
    html = html.replace(old, new)

open(HTML, "w", encoding="utf-8").write(html)

counts = {}
for _, _, stage, _ in entries:
    counts[stage] = counts.get(stage, 0) + 1
print(f"refreshed {len(entries)} books; stages: {counts}")

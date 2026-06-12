"""Fetch card metadata for a set from Scryfall and save the raw card list.

Fetches the main set, then any names appearing in the 17lands draft data that the
set search missed (bonus-sheet reprints) by exact name.

Output: data/scryfall_cards.{SET}.json (list of Scryfall card objects).
Scryfall asks for a User-Agent and <=10 req/sec; we paginate politely.
"""

import json
import sys
import time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

SET_CODE = "SOS"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUT = DATA_DIR / f"scryfall_cards.{SET_CODE}.json"

API = "https://api.scryfall.com/cards/search?q=" + quote(f"e:{SET_CODE.lower()} game:arena") + "&unique=cards"
HEADERS = {"User-Agent": "trophy-pick/0.1 (ryanhcondon@gmail.com)", "Accept": "application/json"}


def get(url, retries=5):
    for attempt in range(retries):
        try:
            with urlopen(Request(url, headers=HEADERS), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if attempt == retries - 1:
                raise
            wait = 2 ** attempt
            print(f"  {e} - retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)


def draft_data_names():
    import pandas as pd
    raw = DATA_DIR / "raw" / f"draft_data_public.{SET_CODE}.PremierDraft.csv.gz"
    header = pd.read_csv(raw, nrows=0)
    return {c[len("pack_card_"):] for c in header.columns if c.startswith("pack_card_")}


def main():
    cards, url = [], API
    while url:
        page = get(url)
        cards.extend(page["data"])
        url = page.get("next_page") if page.get("has_more") else None
        print(f"fetched {len(cards)}/{page.get('total_cards', '?')} cards", file=sys.stderr)
        time.sleep(0.15)

    # bonus-sheet reprints live outside e:{set}; resolve them from the bulk
    # oracle-cards file (one printing per name) to avoid per-card rate limits
    have = {c["name"] for c in cards} | {c["name"].split(" // ")[0] for c in cards}
    missing = draft_data_names() - have
    if missing:
        print(f"resolving {len(missing)} bonus-sheet cards from bulk data", file=sys.stderr)
        bulk_path = DATA_DIR / "raw" / "scryfall_oracle_cards.json"
        if not bulk_path.exists():
            meta = get("https://api.scryfall.com/bulk-data/oracle-cards")
            print(f"downloading {meta['size'] / 1e6:.0f}MB bulk file...", file=sys.stderr)
            with urlopen(Request(meta["download_uri"], headers=HEADERS), timeout=300) as r:
                bulk_path.write_bytes(r.read())
        by_name = {}
        for c in json.loads(bulk_path.read_text()):
            by_name[c["name"]] = c
            if " // " in c["name"]:
                by_name.setdefault(c["name"].split(" // ")[0], c)
        unresolved = sorted(n for n in missing if n not in by_name)
        if unresolved:
            sys.exit(f"FATAL: names not in bulk data: {unresolved}")
        cards.extend(by_name[n] for n in sorted(missing))

    OUT.write_text(json.dumps(cards, indent=1))
    print(f"Saved {len(cards)} cards to {OUT}")


if __name__ == "__main__":
    main()

"""Curate trophy drafts into daily puzzles and emit static JSON for the web app.

Inputs:  data/trophy_drafts.{SET}.csv.gz, data/card_stats.{SET}.csv,
         data/scryfall_cards.{SET}.json
Outputs: web/public/cards.{SET}.json          - card catalog (image, cost, stats)
         web/public/puzzles/YYYY-MM-DD.json   - one puzzle per day
         web/public/puzzles/manifest.json     - available dates

Curation: a pick is "contested" when the top two community choices in the pack
are close (avg-taken-at gap below CONTESTED_GAP). Drafts score by contested
early picks, plus a bonus when the drafter went against the community favorite
(those make fun reveals). 42 obvious picks -> low score -> never published.
"""

import hashlib
import json
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

SET_CODE = "SOS"
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
WEB_PUB = ROOT / "web" / "public"

CONTESTED_GAP = 1.25   # ATA gap below which a pick counts as contested
EARLY_PICK_MAX = 5     # pick_number <= this counts as "early" (first 6 of each pack)
NUM_PUZZLES = 60
START_DATE = date(2026, 6, 12)


def build_catalog():
    stats = pd.read_csv(DATA / f"card_stats.{SET_CODE}.csv", index_col=0)
    stats.index.name = "name"
    catalog = {}
    for c in json.loads((DATA / f"scryfall_cards.{SET_CODE}.json").read_text()):
        name = c["name"].split(" // ")[0]  # 17lands uses front-face names
        img = c.get("image_uris") or c["card_faces"][0]["image_uris"]
        face = c.get("card_faces", [c])[0]
        row = stats.loc[name] if name in stats.index else None
        catalog[name] = {
            "img": img["normal"],
            "cost": face.get("mana_cost", c.get("mana_cost", "")),
            "type": face.get("type_line", c.get("type_line", "")),
            "rarity": c["rarity"],
            "colors": face.get("colors", c.get("colors", [])),
            "ata": None if row is None else round(float(row["avg_taken_at"]), 2),
            "prw": None if row is None else round(float(row["pick_rate_when_seen"]), 4),
        }
    return catalog


def load_drafts():
    df = pd.read_csv(DATA / f"trophy_drafts.{SET_CODE}.csv.gz")
    pack_cols = [c for c in df.columns if c.startswith("pack_card_")]
    # complete, well-formed drafts only
    sizes = df.groupby("draft_id").size()
    df = df[df["draft_id"].isin(sizes[sizes == 42].index)]
    df = df.sort_values(["draft_id", "pack_number", "pick_number"])
    return df, pack_cols


def score_and_build(df, pack_cols, catalog):
    """Return [(score, puzzle_dict)] for every complete trophy draft."""
    names = np.array([c[len("pack_card_"):] for c in pack_cols])
    ata = np.array([catalog[n]["ata"] or 99 for n in names])
    prw = np.array([catalog[n]["prw"] or 0 for n in names])
    pack_matrix = df[pack_cols].to_numpy()

    results = []
    for draft_id, g in df.groupby("draft_id", sort=False):
        rows = pack_matrix[df.index.get_indexer(g.index)]

        picks, score = [], 0.0
        valid = True
        for (_, r), in_pack in zip(g.iterrows(), rows):
            present = np.flatnonzero(in_pack)
            cards = [n for i in present for n in [names[i]] * int(in_pack[i])]
            if r["pick"] not in cards:
                valid = False
                break
            if len(present) > 1:
                pack_ata = np.sort(ata[present])
                contested = (pack_ata[1] - pack_ata[0]) < CONTESTED_GAP
                if contested and r["pick_number"] <= EARLY_PICK_MAX:
                    score += 1.0
                community_fav = names[present[np.argmax(prw[present])]]
                if r["pick"] != community_fav and r["pick_number"] <= EARLY_PICK_MAX:
                    score += 0.5
            picks.append({
                "pack": int(r["pack_number"]),
                "pick": int(r["pick_number"]),
                "cards": sorted(cards),
                "picked": r["pick"],
                "maindecked": bool(r["pick_maindeck_rate"] > 0.5),
            })
        if not valid:
            continue
        first = g.iloc[0]
        puzzle = {
            "set": SET_CODE,
            "id": hashlib.sha1(draft_id.encode()).hexdigest()[:10],
            "rank": first["rank"],
            "record": f"7-{int(first['event_match_losses'])}",
            "picks": picks,
            "deck": sorted(p["picked"] for p in picks if p["maindecked"]),
        }
        results.append((score, puzzle))
    return results


def main():
    catalog = build_catalog()
    df, pack_cols = load_drafts()
    print(f"{df['draft_id'].nunique()} complete trophy drafts")

    results = score_and_build(df, pack_cols, catalog)
    results.sort(key=lambda t: -t[0])
    scores = [s for s, _ in results]
    print(f"interest scores: max={scores[0]:.1f} median={scores[len(scores)//2]:.1f} min={scores[-1]:.1f}")

    (WEB_PUB / "puzzles").mkdir(parents=True, exist_ok=True)
    (WEB_PUB / f"cards.{SET_CODE}.json").write_text(json.dumps(catalog))

    dates = []
    for i, (score, puzzle) in enumerate(results[:NUM_PUZZLES]):
        d = (START_DATE + timedelta(days=i)).isoformat()
        puzzle["date"] = d
        (WEB_PUB / "puzzles" / f"{d}.json").write_text(json.dumps(puzzle))
        dates.append(d)
    (WEB_PUB / "puzzles" / "manifest.json").write_text(json.dumps({"set": SET_CODE, "dates": dates}))
    print(f"wrote {len(dates)} puzzles ({dates[0]} .. {dates[-1]}) + catalog ({len(catalog)} cards)")


if __name__ == "__main__":
    main()

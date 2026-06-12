"""Filter 17lands draft data down to trophy drafts and compute per-card pick stats.

Streams the ~4.4GB-uncompressed CSV in chunks. Two outputs:
  data/trophy_drafts.SOS.csv.gz  - all picks from 7-win mythic/diamond drafts
  data/card_stats.SOS.csv        - per-card: times_seen, times_picked, avg_taken_at,
                                   pick_rate_when_seen (over ALL drafts, all ranks)

Stats use the full population (not just trophies) so "community pick rates" reflect
how contested each pick is, which curation and partial-credit scoring both need.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd

SET_CODE = "SOS"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RAW = DATA_DIR / "raw" / f"draft_data_public.{SET_CODE}.PremierDraft.csv.gz"
TROPHY_OUT = DATA_DIR / f"trophy_drafts.{SET_CODE}.csv.gz"
STATS_OUT = DATA_DIR / f"card_stats.{SET_CODE}.csv"

TROPHY_RANKS = {"mythic", "diamond"}
CHUNKSIZE = 50_000


def main():
    header = pd.read_csv(RAW, nrows=0)
    pack_cols = [c for c in header.columns if c.startswith("pack_card_")]
    card_names = [c[len("pack_card_"):] for c in pack_cols]
    dtypes = {c: np.int8 for c in pack_cols}

    seen = np.zeros(len(pack_cols), dtype=np.int64)
    picked = pd.Series(0, index=pd.Index(card_names, name="name"), dtype=np.int64)
    pick_pos_sum = pd.Series(0.0, index=picked.index)

    total_rows = 0
    trophy_rows = 0
    first_write = True

    for chunk in pd.read_csv(RAW, chunksize=CHUNKSIZE, dtype=dtypes):
        total_rows += len(chunk)

        seen += chunk[pack_cols].to_numpy().sum(axis=0)
        counts = chunk["pick"].value_counts()
        picked = picked.add(counts, fill_value=0)
        # overall pick position 1-42, more intuitive than (pack, pick) pairs
        overall_pos = chunk["pack_number"] * 14 + chunk["pick_number"] + 1
        pick_pos_sum = pick_pos_sum.add(overall_pos.groupby(chunk["pick"]).sum(), fill_value=0)

        trophies = chunk[
            (chunk["event_match_wins"] == 7) & (chunk["rank"].isin(TROPHY_RANKS))
        ]
        if len(trophies):
            trophy_rows += len(trophies)
            trophies.to_csv(
                TROPHY_OUT, mode="w" if first_write else "a",
                header=first_write, index=False, compression="gzip",
            )
            first_write = False

        print(f"\r{total_rows:,} rows processed, {trophy_rows:,} trophy rows", end="", file=sys.stderr)

    print(file=sys.stderr)

    # picked may have gained names not in card_names (shouldn't happen, but don't drop them)
    stats = pd.DataFrame({
        "times_seen": pd.Series(seen, index=pd.Index(card_names, name="name")),
        "times_picked": picked,
        "pick_pos_sum": pick_pos_sum,
    }).fillna(0)
    stats["avg_taken_at"] = (stats["pick_pos_sum"] / stats["times_picked"]).round(2)
    stats["pick_rate_when_seen"] = (stats["times_picked"] / stats["times_seen"]).round(4)
    stats = stats.drop(columns="pick_pos_sum").sort_values("avg_taken_at")
    stats.to_csv(STATS_OUT)

    print(f"Done. {total_rows:,} total rows -> {trophy_rows:,} trophy rows "
          f"({trophy_rows // 42:,} drafts if all complete). Stats for {len(stats)} cards.")


if __name__ == "__main__":
    main()

# Trophy Pick (working title) — daily MTG draft prediction game

A free, login-free daily web game: follow an anonymized 7-win (trophy) draft from a
high-ranked 17lands player, pick by pick. You see the pack and their pool; predict their
pick. Per-pick feedback, end-of-draft reveal (their real deck + record), Wordle-style
shareable score grid, streaks. Inspired by 82-0.com / sixrings.app for NBA.

Owner: Ryan Condon (ryanhcondon@gmail.com) — limited MTG player, NOT a web developer.
Claude builds essentially everything; Ryan sets high-level direction and playtests.

## How to resume (instructions for Claude)

1. Read this file fully, then `git log --oneline -15` to see where work stopped.
2. Work the next unchecked item in the status board. One phase (or sub-chunk) per session.
3. Commit working state frequently — disk + git is the source of truth across sessions,
   never the conversation.
4. Before the session ends (or when context is getting long), update this file:
   check off items, note any new decisions/gotchas in the log at the bottom.

## Session protocol (instructions for Claude — Ryan relies on these)

Ryan is on the Pro plan with real token limits and uses these two conventions:

- **Checkpoint announcements:** every time you finish a coherent chunk (a phase,
  sub-chunk, or any state worth keeping), commit it, update this file, and END your
  message with an explicit, unmissable marker, e.g.:
  "✅ Checkpoint: <what now works>. Committed and roadmap updated — clean stopping
  point. Next up: <next item>."
  Never leave a chunk finished-but-unannounced, and never announce a checkpoint
  without having actually committed + updated the roadmap first.

- **"wrap up" is a command.** When Ryan says "wrap up" (in any phrasing), immediately
  stop adding features or starting new work. Then: (1) get the code to the nearest
  safe state (working > complete — comment out or stash half-done pieces rather than
  leaving the build broken), (2) commit, (3) update this file's status board AND
  session log with the exact stopping point, including mid-phase detail like
  "downloader works; trophy filter written but untested", (4) reply with a short
  summary of what's saved and the precise first action for next session.

## Status board

- [x] Phase 0 — project skeleton, roadmap, git init (2026-06-12)
- [x] Phase 1 — data pipeline (Python, in `pipeline/`) (2026-06-12)
  - [x] Launch set chosen by Ryan: **Secrets of Strixhaven (SOS)** (2026-06-12)
  - [x] Ryan downloaded draft + game data into `data/raw/` (2026-06-12; arrived as
        `.csv.gz.csv` — still gzipped, renamed to `.csv.gz`)
  - [x] Filter trophy drafts (`pipeline/filter_trophies.py`): 4.5M rows -> 113,903
        trophy rows = 2,711 complete mythic/diamond 7-win drafts, all 42 picks clean
  - [x] Curation heuristic (`pipeline/build_puzzles.py`): contested early picks
        (ATA gap < 1.25 between top 2 in pack) + bonus for off-community-favorite picks
  - [x] Scryfall join (`pipeline/fetch_cards.py`): 346 cards (271 in-set via search +
        75 bonus-sheet reprints via bulk oracle-cards file — per-name API 429s)
  - [x] Reveal stats: per-card ATA (within-pack 1-14 scale) + pick-rate-when-seen
        over ALL ranks, in same pass as trophy filter
  - [x] Emit static JSON: 60 puzzles `web/public/puzzles/YYYY-MM-DD.json` (from
        2026-06-12) + `manifest.json` + `web/public/cards.SOS.json` catalog
  - [x] CHECKPOINT: Ryan playtested via `web/public/preview.html` and approved —
        "drafts seem suitably interesting" (2026-06-12). Curation knobs
        (CONTESTED_GAP/EARLY_PICK_MAX in build_puzzles.py) can be retuned anytime,
        rebuild takes seconds. Preview page is throwaway; serve via launch config
        "puzzle-preview" (python http.server :8642). NOTE: page worked in browser
        but not the IDE preview panel for Ryan — unresolved, don't burn time on it.
- [ ] Phase 2 — playable game, local (in `web/`)
  - [x] `brew install node` → node v26.3.0 / npm 11.16.0 (2026-06-12)
  - [x] Vite + React static SPA; core loop: show pack → user picks → feedback → next
        (2026-06-12; plain JSX, no TS; `npm run dev` in web/, or launch config "game-dev")
  - [x] Scoring + end screen (their deck, their record, your agreement %) (2026-06-12;
        partial credit via prw ratio, knobs in `web/src/scoring.js`; end screen has
        42-cell green/yellow/red strip = precursor to Phase 3 share grid)
  - [ ] CHECKPOINT: Ryan playtests at localhost
- [ ] Phase 3 — daily-game wrapper
  - [ ] Date-seeded daily puzzle, archive of past days
  - [ ] localStorage streaks/history, share-grid generator, mobile-first layout polish
  - [ ] About page: 17lands attribution, Wizards Fan Content Policy notice, Scryfall credit
- [ ] Phase 4 — deploy (the only phase needing Ryan's hands)
  - [ ] `brew install gh`, `gh auth login` as ryanhcondon
  - [ ] Create GitHub repo, push, GitHub Actions build → GitHub Pages
  - [ ] Live at ryanhcondon.github.io/<repo>; custom domain optional later
- [ ] Phase 5 (v2, after feedback) — upload-your-own-draft mode, beat-the-bot,
      multi-set, live community pick stats (needs tiny backend)

## Decisions

Made:
- Fully static site, zero backend for v1. All stats precomputed offline.
- Scoring v1 partial credit uses context-blind prw (avg pick rate when seen).
  Ryan: acknowledged weak by mid-draft where picks are highly contextual, but
  "works for now". Upgrade paths, in order of preference: (a) Phase 5 live
  community pick rates *for this exact pack/pool* once the game has traffic;
  (b) before that, the ../17lands BC pick-predictor model could provide
  context-aware "what would a typical player pick here" credit, precomputed
  offline per puzzle (stays static, no backend).
- Hosting: GitHub Pages on Ryan's account (ryanhcondon). No Cloudflare/Vercel —
  one less account; static Pages is sufficient.
- Local-first: phases 1-3 run/playtest entirely on Ryan's machine.
- Stack: Python pipeline → static JSON → React+Vite SPA.

Open (Ryan to decide, defaults in parens):
- Scoring: pure match vs partial credit for defensible picks (default: partial credit
  via community pick rates)
- Final name (candidates: Seven Oh, Trophy Pick, The Wheel, P1P1 Daily) — blocks only
  the repo/domain name

## Key facts

- Data source: https://www.17lands.com/public_datasets —
  `draft_data_public.{SET}.PremierDraft.csv.gz`. Schema (verified against
  `../17lands/data/raw/sample_draft_data.csv`): one row per pick; columns
  `expansion, event_type, draft_id, draft_time, rank, event_match_wins,
  event_match_losses, pack_number, pick_number, pick, pick_maindeck_rate,
  pick_sideboard_in_rate, pack_card_<Name>...` (one-hot pack contents).
- Card metadata/images: Scryfall bulk data API (free, no key). Hotlink image CDN.
- Sibling project `../17lands/` = Ryan's prior draft-ML work (RL pick policy —
  concluded; contextual deck scorer + BC pick predictor reusable for v2 beat-the-bot).
- GitHub: ryanhcondon (exists, no Pages site yet). NOTE: d-street is Ryan's FORMER
  BOSS's account (shared Putt_Sim project) — do not use.
- gh CLI not installed; Node/npm not installed; Homebrew 5.x available.
- Python 3.13.5 via Anaconda (/opt/anaconda3); pandas/numpy available.
- Ryan is on Claude Pro plan → token limits are real. Protocol: bounded sessions,
  commit early, update this file, fresh session per phase.

## Session log

- 2026-06-12: Phase 0. Skeleton + roadmap created. Plan and product design agreed
  in conversation (see also memory). Next: Phase 1 data pipeline.
- 2026-06-12 (session 2): Phase 1 pipeline complete. Gotchas hit: (1) downloads
  arrive still-gzipped despite browser appending .csv — just rename; (2) Scryfall
  429s per-name lookups even at ~8/s — use bulk oracle-cards file (cached in
  data/raw/) for the 75 bonus-sheet reprints; (3) ATA must be within-pack scale
  (pick_number+1, 1-14), NOT overall 1-42, or bombs average ~15 and curation is
  garbage — caught this because "best card in set" had ATA 15. Puzzle JSON shape:
  {set,id,rank,record,date,picks:[{pack,pick,cards[],picked,maindecked}],deck[]};
  catalog cards.SOS.json: name->{img,cost,type,rarity,colors,ata,prw}. Built
  throwaway preview.html checker; Ryan playtested and APPROVED Phase 1 (fun-check
  passed, curation heuristic endorsed as v1). Phase 1 complete. Next session:
  Phase 2 — start with `brew install node`, then Vite+React SPA in web/.
- 2026-06-12 (session 3): Phase 2 built and machine-verified end to end (clicked
  through a full 42-pick draft via browser automation: reveal states, partial
  credit, pool strip, end screen all work; zero console errors). Node installed
  via brew. App structure: web/src/{App,Game,EndScreen}.jsx + scoring.js +
  styles.css; date dropdown in header is a playtest aid, Phase 3 replaces it.
  Scoring v1: match=1pt, miss=0.5×min(1, prw_you/prw_them); headline score is
  pct of max. Launch config "game-dev" runs the dev server on :5173 (npm run
  dev --prefix web). web/dist/ gitignored. AWAITING: Ryan's localhost playtest
  (the Phase 2 checkpoint) — then Phase 3.

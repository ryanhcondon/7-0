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
- [ ] Phase 1 — data pipeline (Python, in `pipeline/`)
  - [x] Launch set chosen by Ryan: **Secrets of Strixhaven (SOS)** (2026-06-12)
  - [ ] Ryan downloading `draft_data_public.SOS.PremierDraft.csv.gz` (+ game data,
        optional) manually into `data/raw/`
  - [ ] Filter trophy drafts (event_match_wins==7, mythic/diamond rank), validate cleanliness
  - [ ] Curation heuristic: prefer drafts with contested early picks (not 42 obvious picks)
  - [ ] Scryfall bulk data join: image URIs, mana cost, rarity, color per card
  - [ ] Compute reveal stats offline (pick popularity / avg pick position per card)
  - [ ] Emit static JSON: `web/public/puzzles/YYYY-MM-DD.json` + per-set card catalog
  - [ ] CHECKPOINT: show Ryan 2-3 raw puzzles, sanity-check they're fun
- [ ] Phase 2 — playable game, local (in `web/`)
  - [ ] `brew install node` (Node/npm NOT yet installed on this machine)
  - [ ] Vite + React static SPA; core loop: show pack → user picks → feedback → next
  - [ ] Scoring + end screen (their deck, their record, your agreement %)
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

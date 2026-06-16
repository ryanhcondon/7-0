# 7-0 — daily MTG draft prediction game (was working title "Trophy Pick")

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
  - [x] Ryan feedback round 1 (2026-06-12): expandable "Your pool" (cards you
        clicked, collapsed by default, under "Their pool") + restructure to
        "yesterday's trophies": each play date = top N_PER_DAY=3 drafts from the
        previous calendar day. Manifest is now {"days": {date: [ids]}}, puzzle
        files keyed by id. Data covers drafts 2026-04-21..06-02 → play dates
        2026-04-22..06-03; app defaults to latest day ≤ today. Phase-1
        preview.html deleted (incompatible with new manifest, was throwaway).
  - [x] Ryan feedback round 2 (2026-06-12): (1) literal "yesterday's trophies"
        retracted — static dataset can't sustain it; draft days now map onto
        consecutive calendar days from LAUNCH_DATE=2026-06-12 (41 days through
        2026-07-22), real date still shown as "drafted ...". v2 idea: scrape
        17lands trophy page (JSON endpoints exist but undocumented).
        (2) Stricter partial credit: flat 0.5, only when your card's prw ≥ 0.8×
        the best prw IN THE PACK (vs-their-pick ratio was too forgiving — late
        packs are all low-prw so random clicks looked defensible; vs-pack-best,
        random play = ~59% red, community-favorite play never red).
        (3) End screen headline is a simulated Premier Draft record ("You went
        5–3"): point fraction mapped linearly over the 10 possible outcomes
        0-3..7-0, capped at the drafter's real record (RECORD_LADDER in
        scoring.js). (4) Maindeck reveal laid out like the 17lands-project
        vdeck human-check reports: creature/noncreature piles by mana value,
        stacked with title + art sliver visible (hover zooms), lands in a row.
        Catalog gained "mv" (Scryfall cmc) to support this.
  - [x] CHECKPOINT: Ryan playtested and approved ("looks great", 2026-06-12).
        Phase 2 complete. Small game/presentation tweaks deferred — priority
        is getting through the whole pipeline to deploy, then iterating.
- [x] Phase 3 — daily-game wrapper (complete 2026-06-12, deployed)
  - [x] Daily view: defaults to today's 3 puzzles (first unfinished), future
        dates hidden; Archive view lists past days with per-puzzle records;
        playtest date-dropdown removed (2026-06-12)
  - [x] localStorage (storage.js, key trophyPick.v1): per-pick saves (mid-game
        resume works across reloads), completed results shown on revisit (no
        replay), streak = consecutive days with ≥1 completed puzzle (shown
        when >1; today-pending doesn't break it)
  - [x] Share grid (share.js): clipboard text, one emoji row per pack —
        "Trophy Pick 2026-06-12 · puzzle 1/3 / Went 4-3 · matched 17/42" + 3×14 🟩🟨🟥
  - [x] About page: 17lands attribution, Wizards Fan Content Policy notice,
        Scryfall credit, not-affiliated note
  - [x] Mobile check at 375px: header wraps, stats stack, piles 2-up — usable;
        deeper polish deferred per Ryan (iterate after deploy)
  - [x] CHECKPOINT: Ryan playtested the daily wrapper live and approved
        ("really good spot", 2026-06-12). Phase 3 complete.
- [x] Phase 4 — deploy. LIVE at https://ryanhcondon.github.io/7-0/ (2026-06-12)
  - [x] GitHub Actions workflow (.github/workflows/deploy.yml: build web/ on
        push to main, deploy to Pages; vite base './' confirmed working under
        the /7-0/ subpath)
  - [x] Auth: NO gh CLI; keychain HTTPS token (ghp_) EXPIRED → 401; SSH key
        ~/.ssh/id_rsa works. Used SSH remote git@github.com:ryanhcondon/7-0.git.
  - [x] Repo ryanhcondon/7-0 created by Ryan (browser), pushed over SSH.
  - [x] Pages source = "GitHub Actions". GOTCHA: first deploy 404'd ("Failed
        to create deployment... Ensure GitHub Pages has been enabled") because
        the build job ran before Pages source was toggled; fixed by setting
        source then "Re-run failed jobs" — no new commit needed.
  - [x] Verified live: index, JS bundle, manifest.json, cards.SOS.json all 200.
  - [ ] (dropped 2026-06-12: scheduled data-refresh rebuild — not needed now
        that play dates are evergreen-mapped; revisit if v2 does live
        "yesterday's trophies" via 17lands trophy-page scrape)
  - [ ] Live at ryanhcondon.github.io/<repo>; custom domain optional later
### Platform pivot (v2) — from static SPA to a real platform

Full rationale in memory [[architecture-direction]] and [[17lands-live-endpoints]].
The original "Phase 5 (v2)" list (upload-your-own-draft, beat-the-bot, multi-set,
live community pick stats) is folded into the phases below.

GROUNDWORK (done — sessions 5–6, branch `nextjs-migration`):
- [x] Frontend ported Vite→Next 15 App Router — pure port, no behavior change (2026-06-15)
- [x] Vercel project live (Root Dir=`web`, Next preset, Deployment Protection OFF);
      Production Branch switched main→`nextjs-migration`; deploys green (2026-06-15)
- [x] 17lands proxy API routes + lib (`web/lib/*`, `web/app/api/{draft,deck,trophies}`),
      gated behind LIVE_17LANDS_ENABLED (off by default); verified live — returns 503
      when off, zero upstream traffic (2026-06-15)
- [x] Supabase `drafts` cache table + service_role wired; write/read/delete round-trip
      VERIFIED against the real project (2026-06-15)

Guiding model: **every playable thing gets a real URL.** Full Draft = ONE player at
`/draft/[id]` fed by three sources — random recent trophy (→ `/draft/<id>`), pasted
17lands link (parse id → `/draft/<id>`), auto-curated daily (→ `/draft/<todayId>`).
Static puzzles and live drafts are both just "ids". Quick stays its own gamified mode
(one-draft / mixed; room for more quick modes later). Real URLs are what unlock share
cards, analytics, and linkable games — which is why the IA restructure comes first.

- [ ] PP1 — IA & navigation **(NEXT — Ryan's #1 priority)**. Real Next routes
      (`/`, `/quick`, `/draft/[id]`), homepage hub with the two paths (Full Draft /
      Quick), back-to-home from end screens. Break the client `App.jsx` into route
      segments. Fold paste-a-link in as a Full Draft source (UI built, flag-gated).
      Auto-curated daily picks one draft automatically (random or light criteria);
      admin-selection / user-voting from randomized drafts deferred.
- [ ] PP2 — cutover + shareable URL + analytics. Make Vercel the public production,
      retire `.github/workflows/deploy.yml` (GitHub Pages). Nicer share link via a
      FREE link shortener for now (paid custom domain deferred; name stays **7-0**).
      Add lightweight traffic analytics — no login required.
- [ ] PP3 — dynamic social share cards per mode (`@vercel/og` + per-URL
      `generateMetadata`). The viral hook. Depends on PP1's URLs. (Before PP2 cutover
      is fine, but cutover ships first per Ryan.)
- [ ] PP4 — live 17lands data ON. Flip LIVE_17LANDS_ENABLED (ONLY after 17lands grants
      permission), wire random-trophy + pasted-link into Full Draft, run one live
      end-to-end smoke test. Proxy already built; this is the switch + the entry points.
- [ ] PP5 — accounts (deferred until traffic justifies — guardrail: don't build login
      before there are users). Supabase auth, save progress to DB, account pages
      (saved drafts, settings), localStorage→DB migration that MERGES existing local
      progress. Design the schema now with that merge in mind.

## Decisions

Made:
- Fully static site, zero backend for v1. All stats precomputed offline.
  [SUPERSEDED 2026-06-15 — platform pivot to Next.js/Vercel + Supabase; see the
  Platform pivot phases above and the new decisions block below.]
- Daily structure (Ryan, 2026-06-12, revised same day): 3 puzzles per day, all
  from one real draft day, with draft days mapped onto consecutive calendar
  days from launch (evergreen — works with the static dataset). Literal
  "yesterday's trophies" needs live data (17lands trophy page scrape) — v2.
- Partial credit (Ryan, 2026-06-12): be stingy — misses should often be red.
  Yellow only when your card was within 0.8× of the pack's best community
  pick rate (knobs in web/src/scoring.js). Headline result is a simulated
  Premier Draft record (0-3..7-0, capped at the drafter's real record);
  score with partial credit is secondary.
- Scoring v1 partial credit uses context-blind prw (avg pick rate when seen).
  Ryan: acknowledged weak by mid-draft where picks are highly contextual, but
  "works for now". Upgrade paths, in order of preference: (a) Phase 5 live
  community pick rates *for this exact pack/pool* once the game has traffic;
  (b) before that, the ../17lands BC pick-predictor model could provide
  context-aware "what would a typical player pick here" credit, precomputed
  offline per puzzle (stays static, no backend).
- Hosting: GitHub Pages on Ryan's account (ryanhcondon). No Cloudflare/Vercel —
  one less account; static Pages is sufficient. [SUPERSEDED 2026-06-15 — now
  Next.js on Vercel + Supabase; GitHub Pages stays the public site only until the
  PP2 cutover.]
- Local-first: phases 1-3 run/playtest entirely on Ryan's machine.
- Stack: Python pipeline → static JSON → React+Vite SPA.

Made (continued):
- Final name = **7-0** (Ryan, 2026-06-12). Repo will be ryanhcondon/7-0 →
  ryanhcondon.github.io/7-0. In-app branding updated (title, h1, About, share
  text). Local folder stays trophy-pick (cosmetic; git remote name differs).
- Scoring: partial credit for defensible picks via community pick rates
  (settled, stingy variant — see scoring decision above).

Made (platform pivot, 2026-06-15):
- Stack: **Next.js on Vercel** (frontend + API proxy + future OG share cards) +
  **Supabase** (Postgres/auth/storage). Migrate in place; retire GitHub Pages at PP2.
- **Navigation model:** two paths from home — Full Draft and Quick. Full Draft is one
  player (`/draft/[id]`) with three sources (random trophy / pasted link / auto-daily);
  Quick keeps one-draft + mixed modes. Everything playable gets a real URL.
- **Sequencing:** IA/navigation first (PP1), then cutover (PP2), then share cards (PP3).
  Build slowly, step by step (Ryan).
- **Name stays 7-0.** The clunky Vercel URL is the pain point, not the name. Use a FREE
  link shortener for a shareable link for now; defer buying a custom domain.
- **Curated daily = automatic** for now (random or light criteria). Admin-picked daily
  and/or user-voting from randomized drafts are later ideas, not v2-blocking.
- **Analytics ≠ auth:** daily-traffic metrics come in PP2 with no login; real accounts
  (PP5) are deferred until traffic justifies them.

Open / decisions pending (non-blocking for PP1):
- Which free link shortener + exact shareable slug (PP2).
- "Light criteria" for auto-daily selection, if not pure random (PP1).
- Share-card visual design per mode (PP3).

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
- 2026-06-12 (session 3, cont.): Ryan playtested, liked it, two changes: (1)
  expandable "Your pool" added to Game.jsx (<details>, collapsed by default);
  (2) "yesterday's trophies" restructure — build_puzzles.py now groups drafts
  by draft_time date, emits top-3 per day as puzzles/<id>.json dated +1 day,
  manifest {"days": {date: [ids]}}; App.jsx gained puzzle tabs + defaults to
  latest day ≤ today. 123 puzzles / 41 days. Machine-verified: tabs load 3
  distinct drafts, fresh load = Pick 1 0/0, both pools render, build clean,
  no console errors. Gotcha: when eval-testing tabs, re-query buttons after
  every click — header remounts during puzzle load, stale nodes no-op.
  Still AWAITING Ryan playtest checkpoint, then Phase 3.
- 2026-06-12 (session 3, cont. 2): Ryan feedback round 2 applied (see status
  board): evergreen date mapping from LAUNCH_DATE (no more literal yesterday),
  stricter vs-pack-best partial credit (reds now common), simulated-premier-
  record end screen ("You went 5–3", capped at their record), maindeck reveal
  as mana-value piles copied from ../17lands/validation/build_vdeck_report.py
  styling. Tuning was simulation-driven — random clicker vs always-community-
  favorite over all 123 puzzles, see scoring.js comment. Machine-verified full
  playthrough; build clean. Phase 3 still pending Ryan's playtest checkpoint.
- 2026-06-12 (session 3, cont. 3): Ryan approved Phase 2 ("looks great");
  wants the full pipeline through deploy before more presentation tweaks.
  Phase 3 built: storage.js (localStorage, resume + results + streak),
  share.js (emoji grid, 1 row per pack), Archive.jsx, About.jsx, App.jsx
  rewritten as daily wrapper (today default, future hidden, tabs show ✓ and
  record, lands on first unfinished puzzle). Completed puzzles show their end
  screen on revisit — no replay path (decision: keeps records honest).
  Machine-verified: mid-game resume across reload, completion persistence,
  next-puzzle flow, archive/about nav, share text format, mobile 375px,
  clean build, no console errors. Next: Ryan playtests, then Phase 4 deploy
  (needs Ryan: brew install gh, gh auth login, repo create).
- 2026-06-12 (session 3, cont. 4): Named the project 7-0 (in-app + repo).
  Auth: gh not installed, keychain HTTPS token dead (401), but SSH key works —
  see [[github-auth]] memory. Deployed via GitHub Actions to Pages. First
  deploy 404'd (Pages source not yet "GitHub Actions"); toggled source +
  re-ran failed jobs → green. LIVE: https://ryanhcondon.github.io/7-0/,
  verified serving (index/JS/data all 200). FULL PIPELINE DONE end-to-end:
  17lands data → Python pipeline → static JSON → React/Vite SPA → daily
  wrapper → auto-deploy on push. Next: iterate on presentation/game tweaks
  (Ryan has a list); every commit to main now auto-deploys. Phase 5 = v2
  features (upload-your-own-draft, beat-the-bot via ../17lands BC model,
  multi-set, live community pick stats, 17lands trophy-page scrape for
  literal "yesterday's trophies").
- 2026-06-12 (session 3, cont. 5): Post-launch aesthetic iteration begins.
  End-screen deck reveal now highlights maindeck cards you passed on (red
  outline + glow, legend count) and adds a collapsible "What you took instead"
  1-for-1 swap view (their card ← your pick) per missed maindecked pick.
  Built by aligning puzzle.picks[i].maindecked with results[i] (deck ==
  sorted maindecked picks, verified). EndScreen DeckPiles now takes entries
  [{name,missed,yourPick}] not bare names. Committed locally; not yet pushed.
- 2026-06-12 (session 3, cont. 6 — END of session, all pushed & LIVE): more
  end-screen iteration, then a batch push. Changes this stretch:
  (1) Fixed highlighted cards "popping" above the stack — removed the z-index/
      position bump on .missed/.swap; outline+glow only (CSS in styles.css).
  (2) Reworked the swap view into "Your version of the deck": your pick at
      every maindecked slot rendered in the same mana-value pile format,
      swapped-in cards outlined BLUE (--swap), read against their RED-outlined
      deck above. Generalized DeckPiles/DeckView to entries [{name,cls,title}].
      1-for-1 kept via blue-card tooltips + a cleaned collapsible "swaps, one
      for one" list (your card "in over" their card).
  (3) Added collapsible "The rest of your pool" = your picks at slots they
      DIDN'T maindeck (your 42 picks split: maindeck slots = your deck, rest =
      bench), so the player can mentally swap off-color/unplayable 1-for-1
      cards for ones that fit. Note: reconstruction is a literal 1-for-1 guess,
      NOT a real deckbuild (an italic note in-app says so). True deckbuild via
      ../17lands BC model is a deferred Phase-5 option.
  (4) Reworked the record curve (draftRecord in scoring.js): was flat frac*10
      (50%→5-3, too generous). Now piecewise, Ryan's anchors: <50%→0-3,
      ~90%→7-2, 95%+→7-0, interpolated between, still capped at their record.
      Knobs = the 0.50/0.90/0.95 anchors at top of draftRecord.
  (5) Italic note under the headline record clarifies it's a pick-MATCHING
      score, not a projected record for your deck.
  All committed AND pushed (origin fe5aca6..248b661); deploy auto-ran, verified
  live bundle on https://ryanhcondon.github.io/7-0/ contains the new strings.
  Local = origin = live, fully in sync. Phases 0-4 all complete.
  NEXT SESSION: more of Ryan's aesthetic/game tweak list (open-ended; no
  specific item queued). Run `npm run dev --prefix web` or launch config
  "game-dev" (vite :5173) to playtest; edits auto-deploy on push to main.
  Tuning knobs: scoring.js (record anchors, PARTIAL_CREDIT/PARTIAL_MIN_RATIO),
  build_puzzles.py (CONTESTED_GAP, EARLY_PICK_MAX, N_PER_DAY, LAUNCH_DATE).
  Gotcha for testing: completed puzzles freeze their record in localStorage
  (key trophyPick.v1) at finish time — old saves show old scores; play a fresh
  puzzle or clear site data to see scoring changes. When eval-driving the UI,
  re-query buttons after each click (header remounts on puzzle/tab switch).
- 2026-06-14 (session 4b): NEW "Quick" mode (web/src/QuickGame.jsx) — a
  compressed best-of run a la 82-0/Six Rings, living in parallel with Daily.
  Nine-slot position ladder = P1P1/early/mid for each of the 3 packs (early=
  picks 1-3, mid=picks 4-7; late picks dropped as usually trivial; 9 = exactly
  the longest possible 7-2 run); each slot draws a real pick from a trophy
  draft at that stage out of the existing 123 static puzzle JSONs (reused, no
  new pipeline). Their pool-so-far renders ABOVE the pack (key context). Match=win, miss=loss (binary, per Ryan);
  run ends at 7 wins or 3 losses. Toggle: "Mixed drafts" (each round a different
  drafter — format snapshot) vs "One draft" (all picks from one drafter, pool
  grows coherently). Shows that drafter's real pool-so-far for context. In
  One-draft mode the end screen also reveals that drafter's full final deck
  (reuses EndScreen's now-exported DeckView; Mixed shows no deck). Endless
  (Play again / flip toggle); no localStorage/streak persistence for Quick yet.
  App.jsx gained a mode toggle (daily|quick) in the nav; Daily path unchanged.
  End screen = record + emoji grid + per-round recap + share. Verified full
  loop in preview (rounds advance 1:1, pips/W-L correct, ends at 3rd loss, all
  three end-screen actions + reset work). Built on the SAME static public
  dataset as Daily, so it ships under the existing "built on 17L public data"
  framing — independent of the pending 17lands live-data ask (see memory
  [[17lands-live-endpoints]]). Committed; NOT yet pushed/deployed pending Ryan
  playtest. Possible follow-ups: per-round partial-credit flavor, best-record
  persistence, share grid polish, intro/explainer copy for the mode.
- 2026-06-15 (session 5): BIG PIVOT — going from static prototype to a real
  platform for the full vision (thousands of DAU, live 17lands data, logins,
  user-submitted drafts, dynamic social share cards). Full rationale + plan in
  memory [[architecture-direction]] and [[17lands-live-endpoints]] (READ BOTH
  to resume). Decisions: stack = Next.js/Vercel (frontend + API proxy + future
  OG share cards) + Supabase (Postgres/auth/storage). 17lands gave a near-yes
  (traffic is their only concern); the 3 needed endpoints are confirmed working
  and named in memory. Quick-mode work from session 4b WAS pushed + deployed to
  the GitHub Pages site earlier this session (still the live prod site).
  DONE this session: migrated frontend Vite→Next 15 (App Router) on branch
  `nextjs-migration` (pushed, NOT merged; GitHub Pages/main untouched & still
  live). App kept in web/; Vercel project configured (Root Directory=web,
  Framework=Next.js, Deployment Protection OFF). Preview deploy verified public
  + playtested — both modes identical, no behavior change. THIS IS A PURE PORT.
  RESUME HERE next session: build the 17lands proxy API routes + Supabase cache
  + paste-a-link live feature — exact step-by-step build plan is in memory
  [[architecture-direction]] under "TO RESUME". Then dynamic share cards, then
  accounts. Cutover (branch→main, retire deploy.yml, Vercel=prod) happens after
  the live demo is solid. Gotcha: dev now = `next dev` on :5173 (launch config
  "game-dev" unchanged); Vercel preview URL changes per deploy.
- 2026-06-15 (session 6): Built + verified the 17lands proxy BACKEND and locked in
  a structured platform roadmap (see status board "Platform pivot" + new decisions).
  Shipped (committed 0a533c7, pushed, deployed as Vercel production from
  `nextjs-migration`): `web/lib/{config,supabase,seventeenlands}.js`,
  `web/app/api/{draft/[id],deck/[id],trophies}/route.js`, `web/app/api/_lib/respond.js`,
  `web/.env.local.example`; added `@supabase/supabase-js`. All live calls gated by
  LIVE_17LANDS_ENABLED (off) with a descriptive User-Agent (site URL + email).
  VERIFIED on the live deploy: `/api/draft/test` + `/api/trophies` return 503 (kill
  switch holds, no 17lands traffic), home 200, publicly reachable. Supabase CONFIRMED
  via a real write/read/delete round-trip (table exists, service_role valid). Ryan did
  the manual setup: service_role into web/.env.local + Vercel env, `drafts` table SQL,
  Production Branch→`nextjs-migration`. Vercel gotchas learned: (1) "No Next.js version
  detected" = it was building `main` (still the Vite app) under the Next preset — fix
  was pointing Production Branch at the migration branch; (2) "Redeploy" rebuilds the
  CLICKED deployment's commit/branch, so it kept pulling main — a fresh `git push` to
  the branch is what actually deploys it. NEXT SESSION = **PP1 (IA & navigation)**:
  real routes `/`, `/quick`, `/draft/[id]`, homepage hub (Full Draft vs Quick),
  back-to-home, split client `App.jsx` into route segments, fold paste-a-link in as a
  Full Draft source (flag-gated), auto-curated daily. Live current deploy:
  https://7-0-d0p0lyfea-ryanhcondons-projects.vercel.app (URL changes per deploy until
  PP2 shortener/cutover). Public site is STILL GitHub Pages until PP2.

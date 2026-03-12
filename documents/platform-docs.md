# Platform Docs — Catch The Elo

## What Is This App

Players are shown a real chess game with player names and ratings hidden. They navigate through the moves, then guess the average Elo of the two players. Score is 0–5000 based on accuracy.

---

## Routes

| Route | Status | Description |
|-------|--------|-------------|
| `/` | Live | Daily chess challenge |
| `/auth` | Live | Sign in / Sign up |
| `/onboarding` | Live | Username picker (OAuth users) |
| `/ranked` | Stub | Ranked 5-round mode (coming soon) |
| `/leaderboard` | Stub | Global and daily leaderboards (coming soon) |
| `/profile` | Stub | User profile and stats (coming soon) |

---

## Daily Game (`/`)

### What the user sees
- Responsive chess board (85vw mobile, max 504px desktop)
- Player clocks above (black) and below (white) the board — shown only if PGN contains clock data
- Move navigator: ‹ Move N / Total › with keyboard arrow support (←/→)
- Elo guess input (numeric, 100–3500) + Submit button

### Key behaviors
- **Player names and Elos are hidden** during play — revealed only in the result modal after submission
- Same game for all players worldwide, synchronized to midnight UTC
- Anonymous users can play; only logged-in users have results saved

### Already-played state
If a logged-in user visits after already submitting today:
- Inline card replaces the guess form
- Shows: their guess, actual Elo, score, emoji bar, countdown to next game (midnight UTC)
- Board is still fully navigable

### Result modal (after submission)
- "Off by X" + score/5,000
- Emoji progress bar: 🟩 for each 1000-point tier, ⬛ otherwise
- Copy button → Wordle-style share text
- "View on Lichess ↗" link (if lichess_id exists)

---

## Scoring

Formula: `score = round(5000 × e^(-((max(0, |guess - actual| - 20) / 300))²))`

- **Grace zone**: within 20 points of actual = perfect 5000
- **Decay**: exponential beyond grace zone; 300-point sigma
- Max: 5000 / Min: 0

**Share text format:**
```
Catch The Elo 🎯
♟️ Rapid | Off by 47
🟩🟩🟩⬛⬛ 3,200/5,000
```

---

## Auth

### Email/password sign up
1. Email + password + username → Server Action validates with Zod
2. `supabase.auth.signUp()` → creates auth user
3. Username written to `profiles` table immediately
4. Password rules: ≥8 chars, ≥1 uppercase, ≥1 digit
5. Username rules: 3–20 chars, alphanumeric + underscores

### Email/password sign in
- Standard `signInWithPassword()`; generic "Incorrect email or password" on failure

### Google OAuth (disabled, coming soon)
- Will create auth user with `username = null`
- Middleware detects `username = null` → redirects to `/onboarding`
- User picks username; redirected to `/`

### Onboarding (`/onboarding`)
- Only accessible to authenticated users with `username = null`
- Redirects to `/auth` if not logged in

---

## Navigation

**Desktop (md+):** Sticky top bar — Logo | Daily · Ranked · Leaderboard | Sign In / My Profile

**Mobile (<md):** Fixed bottom bar — Daily (⚡) · Ranked (⚔️) · Leaderboard (🏆) · Profile (👤)
- Active route shown with colored icon + dot indicator
- Profile icon → `/auth` (logged out) or `/profile` (logged in)

---

## Database

### `profiles`
One row per user. Auto-created on auth signup via trigger (username = null initially).
Key columns: `username` (nullable until set), `rating` (default 1200, for ranked mode), `highest_score`

### `daily_games`
One row per calendar day. Populated via import pipeline from Lichess game dumps.
Key columns: `scheduled_for` (DATE UNIQUE), `pgn` (scrubbed of Elo tags), `white_elo`, `black_elo`, `target_elo`, `metadata` (JSONB with player names + time_control), `lichess_id`

### `game_results`
One row per user result. Supports both daily and ranked modes.
Key columns: `user_id`, `daily_game_id` (nullable), `ranked_game_id` (nullable), `mode` ('daily'|'ranked'), `guess_elo`, `actual_elo`, `score`, `rating_change` (ranked only), `rating_after` (ranked only)
Constraints: XOR check (exactly one game ref), unique (user_id, daily_game_id), RLS: own rows only

---

## Data Pipeline (Import)

Games are sourced from Lichess public game dumps:
1. `scripts/extract_games.py` — streams a `.zst` dump, filters by format/Elo/move count, scrubs Elo-revealing PGN tags, outputs NDJSON
2. `scripts/import_games.py` — reads NDJSON, round-robins across 20 Elo brackets (800–2800), batch-inserts into `daily_games` starting from the next available date

Scrubbed PGN tags: `WhiteElo`, `BlackElo`, `WhiteTitle`, `BlackTitle`, `WhiteRatingDiff`, `BlackRatingDiff`
Kept in PGN: clock annotations `[%clk]` and eval `[%eval]`

---

## Key Technical Notes

- `chess.js` parses PGN with `loadPgn()` (handles inline `{...}` comments from clock/eval data)
- `react-chessboard` v5: board config goes in `options` prop, sizing via `boardStyle: { width, height }`
- No player names/Elos are ever exposed to the client during gameplay — only `white_elo`/`black_elo` computed server-side for scoring
- `submitDailyResult` Server Action is idempotent: silently no-ops if result already exists or user is not authenticated

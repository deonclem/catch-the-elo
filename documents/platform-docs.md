# Platform Docs — Catch The Elo

## What Is This App

Players are shown a real chess game with player names and ratings hidden. They navigate through the moves, then guess the average Elo of the two players. Score is 0–5000 based on accuracy.

---

## Routes

| Route          | Status | Description                               |
| -------------- | ------ | ----------------------------------------- |
| `/`            | Live   | Daily chess challenge                     |
| `/auth`        | Live   | Log in / Sign up (email + Google OAuth)   |
| `/onboarding`  | Live   | Username picker (OAuth users)             |
| `/ranked`      | Live   | Ranked 5-round mode (auth-required)       |
| `/leaderboard` | Live   | Global and daily leaderboards             |
| `/profile`     | Live   | Username, email, sign out (auth-required) |

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

Formula: `score = round(5000 × e^(-((max(0, |guess - actual| - 20) / 400))²))`

- **Grace zone**: within 20 points of actual = perfect 5000
- **Decay**: exponential beyond grace zone; 400-point sigma
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

### Google OAuth

- `signInWithGoogle` server action calls `supabase.auth.signInWithOAuth()` → redirects to Google consent screen
- Callback at `/auth/callback` exchanges the code for a session
- New Google users have `username = null` → middleware redirects to `/onboarding` → user picks username → redirected to `/`
- Requires `NEXT_PUBLIC_SITE_URL` env var (e.g. `http://localhost:3000` for dev, production URL on Vercel)

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

### `games`

Central pool of all imported games (100k+ at scale). Shared by daily challenge and ranked mode.
Key columns: `pgn` (scrubbed of Elo tags), `white_elo`, `black_elo`, `target_elo`, `metadata` (JSONB with player names + time_control), `lichess_id`, `seq_id` (bigserial, used for efficient random sampling via `get_random_games` RPC)

### `daily_schedule`

Links a game to a calendar date. One row per day.
Key columns: `game_id` (FK → games), `scheduled_for` (DATE UNIQUE)

### `ranked_sessions`

One row per ranked mode session (5 rounds) per user.
Key columns: `user_id`, `status` ('active'|'completed'|'abandoned'), `total_score`, `rating_before`, `rating_after`, `started_at`, `completed_at`

### `game_results`

One row per round result. Supports both daily and ranked modes.
Key columns: `user_id`, `game_id` (FK → games), `mode` ('daily'|'ranked'), `guess_elo`, `actual_elo`, `score`, `ranked_session_id` (nullable FK → ranked_sessions), `round_number` (1–5, ranked only), `rating_change` (ranked only), `rating_after` (ranked only)
Constraints: unique (user_id, game_id) WHERE daily; unique (ranked_session_id, game_id) WHERE ranked; RLS: own rows only

---

## Data Pipeline (Import)

Games are sourced from Lichess public game dumps:

1. `scripts/extract_games.py` — streams a `.zst` dump, filters by format/Elo/move count, scrubs Elo-revealing PGN tags, outputs NDJSON
2. `scripts/import_games.py` — reads NDJSON, inserts into `games` pool; for daily mode also creates a `daily_schedule` row per game starting from the next available date; for ranked mode inserts into pool only

Scrubbed PGN tags: `WhiteElo`, `BlackElo`, `WhiteTitle`, `BlackTitle`, `WhiteRatingDiff`, `BlackRatingDiff`
Kept in PGN: clock annotations `[%clk]` and eval `[%eval]`

---

## Ranked Mode (`/ranked`)

Auth-required. Redirects to `/auth` if not logged in.

### Game flow

1. **Lobby**: shows current rating, "Start Session" button
2. **Session** (5 rounds): each round is a random game from the `games` pool
   - Same chess board/navigator/guess form as daily
   - Round progress sidebar shows completed scores
   - After each guess: `ResultDialog` shows score + rating delta — closing it advances to the next round
3. **Complete**: `SessionCompleteCard` shows total score, rating change, per-round breakdown, "Play Again"

### Session resumption

On page load, `getActiveRankedSession(userId)` checks for an in-progress session. If found, the page resumes at the correct round using `game_ids` stored on the session.

### Rating formula

```
expected  = 1 / (1 + 10^((1500 - playerRating) / 400))
actual    = score / 5000
change    = round(32 × (actual - expected))
```

- Virtual opponent fixed at 1500 for all games
- K-factor = 32 (same as standard chess)
- Weaker players gain more for the same performance than stronger ones
- Constants (`GAME_RATING`, `K_FACTOR`, `RANKED_ROUNDS`) live in `lib/chess/scoring.ts`

### Rating security

`submitRankedRound` never trusts client-provided rating. It computes current rating server-side from `session.rating_before` + previous rounds' `rating_after` values.

---

## Key Technical Notes

- `chess.js` parses PGN with `loadPgn()` (handles inline `{...}` comments from clock/eval data)
- `react-chessboard` v5: board config goes in `options` prop, sizing via `boardStyle: { width, height }`
- No player names/Elos are ever exposed to the client during gameplay — only `white_elo`/`black_elo` computed server-side for scoring
- `submitDailyResult` Server Action is idempotent: silently no-ops if result already exists or user is not authenticated

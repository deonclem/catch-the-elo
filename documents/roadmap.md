# Roadmap — Catch The Elo

## Now (Live)

- Daily Challenge — guess the Elo, score 0–5000
- Result persistence for logged-in users
- Email/password auth + onboarding
- Responsive navbar (desktop top / mobile bottom)
- Basic profile page (username, email, sign out)

## Next

### Ranked Mode (`/ranked`)

5-round sessions for authenticated users:

- Each round: a new game from the pool
- Score affects user Elo rating (stored in `profiles.rating`, starts at 1200)
- Session result: total score + Elo delta
- `game_results` table already supports `ranked_game_id`, `rating_change`, `rating_after`
- Requires: `ranked_games` table + session management

### Leaderboards (`/leaderboard`)

- Daily leaderboard: top scores for today's game
- Global leaderboard: top `profiles.rating` values
- Requires: queries on `game_results` + `profiles`

### Profile Page (`/profile`) — expand
- Rating, highest score, history of past daily results
- Requires: DAL queries on `game_results` filtered by user

## Later / Ideas

- Google OAuth (UI button already exists, disabled)
- Anonymous → account conversion prompt after daily game
- Streaks (daily play consistency)
- Game categories (openings, endgames, tactics-heavy)
- Share image (OG card with result)

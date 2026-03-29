# Roadmap — Catch The Elo

## Now (Live)

- Daily Challenge — guess the Elo, score 0–5000
- Result persistence for logged-in users
- Email/password auth + onboarding
- Responsive navbar (desktop top / mobile bottom)
- Profile page with rating, streak, daily history
- Ranked Mode — 5-round sessions, Elo rating system

## Next

### Leaderboards (`/leaderboard`)

- Daily leaderboard: top scores for today's game
- Global leaderboard: top `profiles.rating` values
- Requires: queries on `game_results` + `profiles`

## Later / Ideas

- Google OAuth (UI button already exists, disabled)
- Anonymous → account conversion prompt after daily game
- Streaks (daily play consistency)
- Game categories (openings, endgames, tactics-heavy)
- Share image (OG card with result)

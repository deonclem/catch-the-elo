<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Gueslo. Here is a summary of all changes made:

- **`instrumentation-client.ts`** (new) — Initializes `posthog-js` using Next.js 15.3+ instrumentation pattern with EU host, reverse proxy, and exception capture enabled.
- **`lib/posthog-server.ts`** (new) — Factory function that returns a fresh `posthog-node` client per call, suitable for serverless Server Actions.
- **`next.config.ts`** — Added reverse proxy rewrites for `/ingest/*` → `eu.i.posthog.com` and `/ingest/static/*` → `eu-assets.i.posthog.com`, plus `skipTrailingSlashRedirect: true`.
- **`.env.local`** — Populated `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` (covered by `.gitignore`).

## Events instrumented

| Event                      | Description                                                                           | File                                             |
| -------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `daily_guess_submitted`    | User submits an Elo guess for the daily challenge (client)                            | `app/_components/ChessGame.tsx`                  |
| `daily_result_shared`      | User copies the Wordle-style share text after the daily game (client)                 | `app/_components/ResultDialog.tsx`               |
| `signup_nudge_clicked`     | Anonymous user clicks "Create a free account" from the result dialog (client)         | `app/_components/ResultDialog.tsx`               |
| `ranked_nudge_clicked`     | Logged-in user clicks "Start a ranked session" from the result dialog upsell (client) | `app/_components/ResultDialog.tsx`               |
| `ranked_session_started`   | User clicks Start Session in the ranked lobby (client)                                | `app/ranked/_components/RankedLobby.tsx`         |
| `ranked_session_replayed`  | User clicks Play Again after completing a ranked session (client)                     | `app/ranked/_components/SessionCompleteCard.tsx` |
| `user_signed_up`           | Email/password sign-up completed (server) — includes `posthog.identify()`             | `lib/actions/auth.ts`                            |
| `user_signed_in`           | Email/password sign-in completed (server) — includes `posthog.identify()`             | `lib/actions/auth.ts`                            |
| `daily_result_saved`       | Daily game result persisted to DB for a logged-in user (server)                       | `lib/actions/games.ts`                           |
| `ranked_round_submitted`   | A ranked round result is saved server-side (server)                                   | `lib/actions/ranked.ts`                          |
| `ranked_session_completed` | All 5 ranked rounds done, session finalized (server)                                  | `lib/actions/ranked.ts`                          |

## Next steps

We've built a dashboard and 5 insights to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://eu.posthog.com/project/155023/dashboard/608380)

### Insights

- [Daily Guesses — Unique Players](https://eu.posthog.com/project/155023/insights/TXV2Zb5B) — How many distinct users play the daily challenge each day
- [New Signups Over Time](https://eu.posthog.com/project/155023/insights/P5d6INPg) — Daily new account registrations
- [Anonymous → Account Conversion Funnel](https://eu.posthog.com/project/155023/insights/xS8Subzn) — Conversion from daily guess → nudge click → signup (key growth funnel)
- [Ranked Mode Completion Funnel](https://eu.posthog.com/project/155023/insights/sZUPnhjf) — How many users who start a ranked session complete all 5 rounds
- [Result Share Rate](https://eu.posthog.com/project/155023/insights/iKCuT9W6) — Percentage of daily guesses that result in a share (virality metric)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

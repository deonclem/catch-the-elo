# Catch The Elo

A competitive chess web app where players guess the average Elo rating of a match based on PGN data.

## Modes

- **Daily Challenge** — one game per day, no account required, shareable results
- **Ranked Mode** — 5-round sessions, requires account, tracks your Elo rating

## Tech Stack

- [Next.js 16](https://nextjs.org) — App Router, Server Components
- [TypeScript](https://www.typescriptlang.org) — strict mode
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) — auth, database, RLS

## Development

```bash
npm run dev       # start dev server
npm run build     # production build
npm run cleanup   # type-check + lint + format
```

```bash
npx supabase db push                                                        # apply migrations
npx supabase gen types typescript --project-id <id> > lib/database.types.ts # regenerate types
```

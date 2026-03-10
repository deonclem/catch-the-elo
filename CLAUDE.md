# CLAUDE.md - Catch The Elo

## 🎯 Project Vision

A competitive chess web application where players guess the average Elo rating of a match based on PGN data.

- **Daily Challenge**: 24h global game, no auth required, shareable results.
- **Ranked Mode**: 5-round sessions, requires account, tracks user Elo rating.
- **Social**: Global and daily leaderboards.

## 🛠 Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend/Auth**: Supabase
- **Icons**: Lucide React

## 📏 Development Principles

- **Architecture**: Prioritize Server Components; use Client Components only for interactivity.
- **Data Flow**: Use Server Actions (`use server`) for all database mutations.
- **Validation**: All external data (Env vars, Server Action inputs, API responses) MUST be validated with Zod schemas.
- **Style**: Functional components, utility-first CSS (Tailwind), no separate CSS files.
- **Quality**: No `any` types, strict null checks, no useEffect, and consistent error handling.
- **Code versioning**: Do not commit or push code unless explicitly instructed to do so.
- **Documentation**: You have full authority to update this file and keep it in sync with the codebase changes.

## 🧹 Quality Control Workflow (CRITICAL)

- **Mandatory Post-Dev Action**: After feature implementation or code change, you MUST run `npm run cleanup`.
- **Error Handling**: If `npm run cleanup` fails, analyze the output, fix the issues, and run it again until it passes.
- **Style Consistency**: Never bypass Prettier formatting. Use the `cn()` utility for Tailwind class merging.

## 💾 Essential Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Type Check**: `npx tsc --noEmit`
- **Lint**: `npm run lint`
- **Supabase CLI**: `supabase db push` / `supabase gen types typescript --local`

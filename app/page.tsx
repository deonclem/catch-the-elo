import { parseDailyGame } from '@/lib/chess/parser'
import {
  getDailyGameResultForUser,
  getResultsForDailyGames,
} from '@/lib/dal/game_results'
import {
  getDailyGame,
  getDailyGameByDate,
  getRecentDailyGames,
} from '@/lib/dal/games'
import {
  computeActiveStreak,
  computeStreakStatus,
  getProfileByUserId,
  type StreakStatus,
} from '@/lib/dal/profiles'
import { createClient } from '@/utils/supabase/server'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ChessGame } from './_components/ChessGame'
import type { DayEntry } from './_components/DailyCalendar'

export const metadata: Metadata = {
  title: 'Gueslo | Ranked Guess The Elo',
  description:
    "Chess Eloguessr. Play Daily Games & Ranked Mode.",
  alternates: { canonical: 'https://gueslo.app' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Gueslo',
  description:
    'Chess Eloguessr. Play Daily Games & Ranked Mode.',
  url: 'https://gueslo.app',
  applicationCategory: 'Game',
  genre: 'Chess',
  offers: { '@type': 'Offer', price: '0' },
}

const dailyResultCookieSchema = z.object({
  gameId: z.string().uuid(),
  guessElo: z.number().int().min(100).max(3500),
  actualElo: z.number().int().min(100).max(3500),
  score: z.number().int().min(0).max(5000),
})

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]
  const { date: dateParam } = await searchParams

  const [dailyGame, recentGames] = await Promise.all([
    getDailyGame(),
    getRecentDailyGames(7),
  ])

  // Validate date param — must be a past date within the recent games list
  const validPastDates = new Set(
    recentGames.map((g) => g.scheduled_for).filter((d) => d !== today)
  )
  if (dateParam !== undefined && !validPastDates.has(dateParam)) {
    redirect('/')
  }

  const selectedDate = dateParam ?? today
  const isToday = selectedDate === today

  const targetGame = isToday
    ? dailyGame
    : await getDailyGameByDate(selectedDate)

  if (!targetGame) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">No game scheduled for today.</p>
      </main>
    )
  }

  const parsedGame = parseDailyGame(targetGame)

  // Build completion map for logged-in users
  let scoreMap = new Map<string, number>()
  let existingResult = null
  let streak = 0
  let streakStatus: StreakStatus = 'none'

  if (user) {
    const [profile, map] = await Promise.all([
      getProfileByUserId(user.id),
      getResultsForDailyGames(
        user.id,
        recentGames.map((g) => g.id)
      ),
    ])
    scoreMap = map
    existingResult = scoreMap.has(targetGame.id)
      ? await getDailyGameResultForUser(user.id, targetGame.id)
      : null
    streak = computeActiveStreak(profile)
    streakStatus = computeStreakStatus(profile)
  } else if (isToday) {
    const cookieStore = await cookies()
    const raw = cookieStore.get('dte_daily_result')?.value
    if (raw) {
      try {
        const parsed = dailyResultCookieSchema.safeParse(
          JSON.parse(decodeURIComponent(raw))
        )
        if (parsed.success && parsed.data.gameId === targetGame.id) {
          const { guessElo, actualElo, score } = parsed.data
          existingResult = { guessElo, actualElo, score }
        }
      } catch {
        // malformed cookie — ignore
      }
    }
  }

  // Build DayEntry list (most recent first)
  const recentDays: DayEntry[] = recentGames.map((g) => ({
    date: g.scheduled_for,
    gameId: g.id,
    isToday: g.scheduled_for === today,
    played: scoreMap.has(g.id),
    score: scoreMap.get(g.id) ?? null,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex flex-1 flex-col items-center justify-center p-12">
        <ChessGame
          game={parsedGame}
          dailyGameId={isToday ? targetGame.id : undefined}
          existingResult={existingResult}
          recentDays={recentDays}
          isLoggedIn={user !== null}
          streak={streak}
          streakStatus={streakStatus}
          isToday={isToday}
          selectedDate={selectedDate}
          pastDayElo={!isToday ? (targetGame.target_elo ?? null) : undefined}
        />
      </main>
    </>
  )
}

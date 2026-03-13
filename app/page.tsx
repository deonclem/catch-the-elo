import { ChessGame } from '@/components/ChessGame'
import type { DayEntry } from '@/components/DailyCalendar'
import { parseDailyGame } from '@/lib/chess/parser'
import {
  getDailyGameResultForUser,
  getResultsForDailyGames,
} from '@/lib/dal/game_results'
import { getDailyGame, getRecentDailyGames } from '@/lib/dal/games'
import { computeActiveStreak, getProfileByUserId } from '@/lib/dal/profiles'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'

const dailyResultCookieSchema = z.object({
  dailyGameId: z.uuid(),
  guessElo: z.number().int().min(100).max(3500),
  actualElo: z.number().int().min(100).max(3500),
  score: z.number().int().min(0).max(5000),
})

const today = new Date().toISOString().split('T')[0]

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [dailyGame, recentGames] = await Promise.all([
    getDailyGame(),
    getRecentDailyGames(7),
  ])

  if (!dailyGame) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">No game scheduled for today.</p>
      </main>
    )
  }

  const parsedGame = parseDailyGame(dailyGame)

  // Build completion map for logged-in users
  let scoreMap = new Map<string, number>()
  let existingResult = null
  let streak = 0

  if (user) {
    const [profile, map] = await Promise.all([
      getProfileByUserId(user.id),
      getResultsForDailyGames(
        user.id,
        recentGames.map((g) => g.id)
      ),
    ])
    scoreMap = map
    existingResult = scoreMap.has(dailyGame.id)
      ? await getDailyGameResultForUser(user.id, dailyGame.id)
      : null
    streak = computeActiveStreak(profile)
  } else {
    const cookieStore = await cookies()
    const raw = cookieStore.get('dte_daily_result')?.value
    if (raw) {
      try {
        const parsed = dailyResultCookieSchema.safeParse(
          JSON.parse(decodeURIComponent(raw))
        )
        if (parsed.success && parsed.data.dailyGameId === dailyGame.id) {
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
    <main className="flex flex-1 flex-col items-center justify-center p-12">
      <ChessGame
        game={parsedGame}
        dailyGameId={dailyGame.id}
        existingResult={existingResult}
        recentDays={recentDays}
        isLoggedIn={user !== null}
        streak={streak}
      />
    </main>
  )
}

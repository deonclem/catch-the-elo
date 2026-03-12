import { cookies } from 'next/headers'
import { z } from 'zod'
import { getDailyGame } from '@/lib/dal/games'
import { getDailyGameResultForUser } from '@/lib/dal/game_results'
import { parseDailyGame } from '@/lib/chess/parser'
import { ChessGame } from '@/components/ChessGame'
import { createClient } from '@/utils/supabase/server'

const dailyResultCookieSchema = z.object({
  dailyGameId: z.uuid(),
  guessElo: z.number().int().min(100).max(3500),
  actualElo: z.number().int().min(100).max(3500),
  score: z.number().int().min(0).max(5000),
})

export default async function Home() {
  const dailyGame = await getDailyGame()

  if (!dailyGame) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">No game scheduled for today.</p>
      </main>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const parsedGame = parseDailyGame(dailyGame)

  let existingResult = null
  if (user) {
    existingResult = await getDailyGameResultForUser(user.id, dailyGame.id)
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Daily Game
      </h1>
      <ChessGame
        game={parsedGame}
        dailyGameId={dailyGame.id}
        existingResult={existingResult}
      />
    </main>
  )
}

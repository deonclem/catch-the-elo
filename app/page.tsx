import { getDailyGame } from '@/lib/dal/games'
import { getDailyGameResultForUser } from '@/lib/dal/game_results'
import { parseDailyGame } from '@/lib/chess/parser'
import { ChessGame } from '@/components/ChessGame'
import { createClient } from '@/utils/supabase/server'

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
  const existingResult = user
    ? await getDailyGameResultForUser(user.id, dailyGame.id)
    : null

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

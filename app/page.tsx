import { getDailyGame } from '@/lib/dal/games'
import { parseDailyGame } from '@/lib/chess/parser'
import { ChessGame } from '@/components/ChessGame'

export default async function Home() {
  const dailyGame = await getDailyGame()

  if (!dailyGame) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">No game scheduled for today.</p>
      </main>
    )
  }

  const parsedGame = parseDailyGame(dailyGame)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Daily Game
      </h1>
      <ChessGame game={parsedGame} />
    </main>
  )
}

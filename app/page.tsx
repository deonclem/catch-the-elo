import { fetchRandomLichessGame } from '@/lib/services/lichess'
import { parseGame } from '@/lib/chess/parser'
import { ChessGame } from '@/components/ChessGame'

export default async function Home() {
  const lichessGame = await fetchRandomLichessGame()
  const parsedGame = parseGame(lichessGame)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Catch The Elo
      </h1>
      <ChessGame game={parsedGame} />
    </main>
  )
}

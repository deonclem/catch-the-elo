import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import type { ParsedGame } from '@/lib/chess/parser'
import { GameInfoCard } from './GameInfoCard'
import { PlayerClock, playerOutcome } from './PlayerClock'

const ChessBoardClient = dynamic(
  () =>
    import('./ChessBoardClient').then((m) => ({ default: m.ChessBoardClient })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted aspect-square w-[85vw] max-w-[504px] animate-pulse rounded-xl" />
    ),
  }
)

type Props = {
  game: ParsedGame
  currentFen: string
  whiteClock: string | null
  blackClock: string | null
  isAtLastMove: boolean
  header?: ReactNode
}

export function BoardColumn({
  game,
  currentFen,
  whiteClock,
  blackClock,
  isAtLastMove,
  header,
}: Props) {
  return (
    <div className="flex w-[85vw] max-w-[504px] shrink-0 flex-col items-center gap-4">
      {header}
      <GameInfoCard timeControl={game.timeControl} />
      <PlayerClock
        color="black"
        clock={blackClock}
        outcome={isAtLastMove ? playerOutcome('black', game.result) : undefined}
        fen={currentFen}
      />
      <ChessBoardClient fen={currentFen} />
      <PlayerClock
        color="white"
        clock={whiteClock}
        outcome={isAtLastMove ? playerOutcome('white', game.result) : undefined}
        fen={currentFen}
      />
    </div>
  )
}

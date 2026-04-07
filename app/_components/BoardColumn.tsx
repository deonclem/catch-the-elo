import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import type { ParsedGame } from '@/lib/chess/parser'
import { GameInfoCard } from './GameInfoCard'
import { PlayerClock, playerOutcome } from './PlayerClock'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  // Mobile navigator (shown below board on mobile only)
  moveLabel?: string
  canGoBack?: boolean
  canGoForward?: boolean
  onBack?: () => void
  onForward?: () => void
}

export function BoardColumn({
  game,
  currentFen,
  whiteClock,
  blackClock,
  isAtLastMove,
  header,
  moveLabel,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: Props) {
  const showMobileNav = onBack !== undefined && onForward !== undefined

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

      {/* Mobile-only move navigator — large touch targets */}
      {showMobileNav && (
        <div className="flex w-full items-center justify-between gap-3 md:hidden">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={!canGoBack}
            aria-label="Previous move"
            className="h-12 flex-1"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <span className="text-muted-foreground min-w-[90px] text-center text-sm">
            {moveLabel}
          </span>
          <Button
            variant="outline"
            onClick={onForward}
            disabled={!canGoForward}
            aria-label="Next move"
            className="h-12 flex-1"
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { ParsedGame } from '@/lib/chess/parser'
import { useChessGame } from '@/hooks/useChessGame'
import { MoveNavigator } from '@/app/_components/MoveNavigator'
import { PlayerClock, playerOutcome } from '@/app/_components/PlayerClock'
import { GameInfoCard } from '@/app/_components/GameInfoCard'

const ChessBoardClient = dynamic(
  () =>
    import('@/app/_components/ChessBoardClient').then((m) => ({
      default: m.ChessBoardClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted aspect-square w-[85vw] max-w-[504px] animate-pulse rounded-xl" />
    ),
  }
)

type Props = {
  game: ParsedGame
}

export function RankedRound({ game }: Props) {
  const {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    currentFen,
    moveLabel,
    whiteClock,
    blackClock,
    isAtLastMove,
  } = useChessGame(game)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goForward()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [goBack, goForward])

  return (
    <div className="flex w-[85vw] max-w-[504px] shrink-0 flex-col items-center gap-4">
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
      <MoveNavigator
        moveLabel={moveLabel}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
      />
      <p className="text-muted-foreground text-xs">
        Use ← → arrow keys to navigate
      </p>
    </div>
  )
}

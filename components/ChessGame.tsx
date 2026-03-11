'use client'

import dynamic from 'next/dynamic'
import type { ParsedGame } from '@/lib/chess/parser'
import { useChessGame } from '@/hooks/useChessGame'
import { GameInfoCard } from './GameInfoCard'
import { MoveNavigator } from './MoveNavigator'
import { EloGuessForm } from './EloGuessForm'
import { ResultDialog } from './dialogs/ResultDialog'

const ChessBoardClient = dynamic(
  () =>
    import('./ChessBoardClient').then((m) => ({ default: m.ChessBoardClient })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted aspect-square w-[95vw] max-w-[560px] animate-pulse rounded" />
    ),
  }
)

type Props = {
  game: ParsedGame
}

export function ChessGame({ game }: Props) {
  const {
    guess,
    setGuess,
    result,
    setResult,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    handleSubmit,
    currentFen,
    moveLabel,
  } = useChessGame(game)

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  return (
    <div
      tabIndex={0}
      autoFocus
      onKeyDown={handleKeyDown}
      className="flex flex-col items-center gap-4 outline-none"
    >
      <GameInfoCard timeControl={game.timeControl} />
      <ChessBoardClient fen={currentFen} />
      <MoveNavigator
        moveLabel={moveLabel}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
      />
      {result === null && (
        <EloGuessForm
          guess={guess}
          onChange={setGuess}
          onSubmit={handleSubmit}
        />
      )}
      <p className="text-muted-foreground text-xs">
        Use ← → arrow keys to navigate
      </p>
      {result !== null && (
        <ResultDialog
          open={true}
          onClose={() => setResult(null)}
          guess={Number(guess)}
          actual={result.actual}
          score={result.score}
          speed={game.timeControl}
        />
      )}
    </div>
  )
}

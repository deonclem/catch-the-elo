'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ParsedGame } from '@/lib/chess/parser'
import { useChessGame } from '@/hooks/useChessGame'
import { submitDailyResult } from '@/lib/actions/games'
import { MoveNavigator } from './MoveNavigator'
import { EloGuessForm } from './EloGuessForm'
import { AlreadyPlayedCard } from './AlreadyPlayedCard'
import { PlayerClock } from './PlayerClock'
import { ResultDialog } from './dialogs/ResultDialog'

const ChessBoardClient = dynamic(
  () =>
    import('./ChessBoardClient').then((m) => ({ default: m.ChessBoardClient })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted aspect-square w-[85vw] max-w-[504px] animate-pulse rounded" />
    ),
  }
)

type ExistingResult = {
  guessElo: number
  actualElo: number
  score: number
}

type Props = {
  game: ParsedGame
  dailyGameId?: string
  existingResult?: ExistingResult | null
}

export function ChessGame({ game, dailyGameId, existingResult }: Props) {
  const [submittedResult, setSubmittedResult] =
    useState<ExistingResult | null>(null)

  const onResult = dailyGameId
    ? (guessElo: number, actualElo: number, score: number) => {
        setSubmittedResult({ guessElo, actualElo, score })
        submitDailyResult(dailyGameId, guessElo, actualElo, score).catch(
          () => {}
        )
      }
    : undefined

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
    whiteClock,
    blackClock,
  } = useChessGame(game, onResult)

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
    <div className="flex w-[85vw] max-w-[504px] flex-col items-center gap-4 outline-none">
      {blackClock && <PlayerClock color="black" clock={blackClock} />}
      <ChessBoardClient fen={currentFen} />
      {whiteClock && <PlayerClock color="white" clock={whiteClock} />}
      <MoveNavigator
        moveLabel={moveLabel}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
      />
      {existingResult ?? submittedResult ? (
        <AlreadyPlayedCard {...(existingResult ?? submittedResult)!} />
      ) : (
        result === null && (
          <EloGuessForm
            guess={guess}
            onChange={setGuess}
            onSubmit={handleSubmit}
          />
        )
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
          lichessUrl={game.id ? `https://lichess.org/${game.id}` : undefined}
        />
      )}
    </div>
  )
}

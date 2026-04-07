'use client'

import { BoardColumn } from '@/app/_components/BoardColumn'
import { EloGuessForm } from '@/app/_components/EloGuessForm'
import { GuessCard } from '@/app/_components/GuessCard'
import { ResultDialog } from '@/app/_components/ResultDialog'
import { useChessGame } from '@/hooks/useChessGame'
import type { RoundResult } from '@/lib/dal/game_results'
import type { RankedSession } from '@/lib/dal/ranked_sessions'
import type { ParsedGame } from '@/lib/chess/parser'
import {
  calculateAverageElo,
  calculateScore,
  RANKED_ROUNDS,
} from '@/lib/chess/scoring'
import { submitRankedRound } from '@/lib/actions/ranked'
import { Swords, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RoundProgress } from './RoundProgress'
import { SessionCompleteCard } from './SessionCompleteCard'

type PendingResult = {
  guessElo: number
  actualElo: number
  score: number
  ratingChange: number
  ratingAfter: number
}

type Props = {
  session: RankedSession
  games: ParsedGame[]
  completedRounds: RoundResult[]
}

export function RankedGame({ session, games, completedRounds }: Props) {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(
    completedRounds.length
  )
  const [roundResults, setRoundResults] =
    useState<RoundResult[]>(completedRounds)
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isSessionComplete = roundResults.length === RANKED_ROUNDS
  const currentGame = games[Math.min(currentRoundIndex, games.length - 1)]!
  const isLastRound = currentRoundIndex + 1 === RANKED_ROUNDS

  const {
    guess,
    setGuess,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    currentFen,
    moveLabel,
    whiteClock,
    blackClock,
    isAtLastMove,
  } = useChessGame(currentGame)

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

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (isSubmitting) return
    const actualElo = calculateAverageElo(
      currentGame.white.elo,
      currentGame.black.elo
    )
    if (actualElo === null || !guess) return
    const score = calculateScore(Number(guess), actualElo)
    setIsSubmitting(true)
    setSubmitError(null)
    const result = await submitRankedRound({
      sessionId: session.id,
      roundNumber: currentRoundIndex + 1,
      gameId: session.gameIds[currentRoundIndex]!,
      guessElo: Number(guess),
    })
    setIsSubmitting(false)
    if ('error' in result) {
      setSubmitError('Something went wrong. Please try again.')
      return
    }
    setPendingResult({ guessElo: Number(guess), actualElo, score, ...result })
  }

  function handleDialogClose() {
    if (!pendingResult) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    const roundNumber = currentRoundIndex + 1
    setRoundResults((prev) => [
      ...prev,
      {
        roundNumber,
        gameId: games[currentRoundIndex]!.id,
        guessElo: pendingResult.guessElo,
        actualElo: pendingResult.actualElo,
        score: pendingResult.score,
        ratingChange: pendingResult.ratingChange,
        ratingAfter: pendingResult.ratingAfter,
      },
    ])
    setPendingResult(null)
    setGuess('')
    if (!isLastRound) {
      setCurrentRoundIndex((i) => i + 1)
    }
  }

  const lastResult = roundResults[roundResults.length - 1]

  if (isSessionComplete && lastResult) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <SessionCompleteCard
          ratingBefore={session.ratingBefore}
          ratingAfter={lastResult.ratingAfter}
          roundResults={roundResults}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
      {/* Left column — rounds card (desktop only) */}
      <div className="bg-card border-border hidden w-[220px] shrink-0 overflow-hidden rounded-xl border lg:block">
        <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
          <Swords className="text-muted-foreground size-4" />
          <h2 className="text-sm font-semibold">Rounds</h2>
        </div>
        <div className="p-3">
          <RoundProgress
            currentRoundIndex={currentRoundIndex}
            roundResults={roundResults}
          />
        </div>
      </div>

      {/* Middle column — board */}
      <BoardColumn
        game={currentGame}
        currentFen={currentFen}
        whiteClock={whiteClock}
        blackClock={blackClock}
        isAtLastMove={isAtLastMove}
        moveLabel={moveLabel}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
        header={
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              <span className="from-primary to-primary-end bg-gradient-to-r bg-clip-text text-transparent">
                Ranked
              </span>{' '}
              Mode
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Round {currentRoundIndex + 1} of {RANKED_ROUNDS}
            </p>
          </div>
        }
      />

      {/* Right column — guess card */}
      <GuessCard
        Icon={Target}
        iconClass="text-primary"
        title="Make Your Guess"
        moveLabel={moveLabel}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
      >
        {!isSessionComplete && (
          <div className="flex flex-col gap-2">
            <EloGuessForm
              guess={guess}
              onChange={setGuess}
              onSubmit={handleSubmit}
              disabled={isSubmitting}
            />
            {submitError && (
              <p className="text-destructive text-center text-xs">
                {submitError}
              </p>
            )}
          </div>
        )}
      </GuessCard>

      {pendingResult && (
        <ResultDialog
          open={true}
          onClose={handleDialogClose}
          guess={pendingResult.guessElo}
          actual={pendingResult.actualElo}
          score={pendingResult.score}
          lichessUrl={
            currentGame.id ? `https://lichess.org/${currentGame.id}` : undefined
          }
          ratingChange={pendingResult.ratingChange}
          nextLabel={isLastRound ? 'See Results' : 'Next Round'}
        />
      )}
    </div>
  )
}

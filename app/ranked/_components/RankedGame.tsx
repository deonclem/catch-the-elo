'use client'

import { useState } from 'react'
import type { ParsedGame } from '@/lib/chess/parser'
import type { RankedSession } from '@/lib/dal/ranked_sessions'
import type { RoundResult } from '@/lib/dal/game_results'
import { submitRankedRound } from '@/lib/actions/ranked'
import {
  calculateAverageElo,
  calculateScore,
  RANKED_ROUNDS,
} from '@/lib/chess/scoring'
import { EloGuessForm } from '@/app/_components/EloGuessForm'
import { ResultDialog } from '@/app/_components/ResultDialog'
import { RankedRound } from './RankedRound'
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
  const [guess, setGuess] = useState('1500')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isSessionComplete = roundResults.length === RANKED_ROUNDS
  const currentGame = games[currentRoundIndex]
  const isLastRound = currentRoundIndex + 1 === RANKED_ROUNDS

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!currentGame || isSubmitting) return
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
      actualElo,
      score,
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
    setGuess('1500')
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
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
      {/* Left column — round progress */}
      <div className="w-full max-w-[280px] lg:w-[180px] lg:shrink-0">
        <RoundProgress
          currentRoundIndex={currentRoundIndex}
          roundResults={roundResults}
        />
      </div>

      {/* Middle column — board */}
      {currentGame && (
        <RankedRound key={currentRoundIndex} game={currentGame} />
      )}

      {/* Right column — guess form */}
      <div className="w-full max-w-[280px] shrink-0 lg:w-[220px]">
        {!pendingResult && currentGame && (
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
      </div>

      {/* Result dialog */}
      {pendingResult && (
        <ResultDialog
          open={true}
          onClose={handleDialogClose}
          guess={pendingResult.guessElo}
          actual={pendingResult.actualElo}
          score={pendingResult.score}
          speed={currentGame?.timeControl ?? ''}
          lichessUrl={
            currentGame?.id
              ? `https://lichess.org/${currentGame.id}`
              : undefined
          }
          ratingChange={pendingResult.ratingChange}
          nextLabel={isLastRound ? 'See Results' : 'Next Round'}
        />
      )}
    </div>
  )
}

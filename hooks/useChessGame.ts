'use client'

import { useState } from 'react'
import type { ParsedGame } from '@/lib/chess/parser'
import { calculateAverageElo, calculateScore } from '@/lib/chess/scoring'

type Result = {
  actual: number
  score: number
}

export function useChessGame(game: ParsedGame) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const canGoBack = currentMoveIndex > 0
  const canGoForward = currentMoveIndex < game.positions.length - 1

  const goBack = () => setCurrentMoveIndex((i) => Math.max(0, i - 1))
  const goForward = () =>
    setCurrentMoveIndex((i) => Math.min(game.positions.length - 1, i + 1))

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const averageElo = calculateAverageElo(game.white.elo, game.black.elo)
    if (averageElo === null || !guess) return
    setResult({
      actual: averageElo,
      score: calculateScore(Number(guess), averageElo),
    })
  }

  const currentFen = game.positions[currentMoveIndex]!
  const moveLabel =
    currentMoveIndex === 0
      ? 'Start'
      : `Move ${currentMoveIndex} / ${game.moves.length}`

  return {
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
  }
}

'use client'

import { useCallback, useState } from 'react'
import type { ParsedGame } from '@/lib/chess/parser'
import { calculateAverageElo, calculateScore } from '@/lib/chess/scoring'

type Result = {
  actual: number
  score: number
}

export function useChessGame(
  game: ParsedGame,
  onResult?: (guessElo: number, actualElo: number, score: number) => void
) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [guess, setGuess] = useState('1500')
  const [result, setResult] = useState<Result | null>(null)

  const canGoBack = currentMoveIndex > 0
  const canGoForward = currentMoveIndex < game.positions.length - 1

  const goBack = useCallback(
    () => setCurrentMoveIndex((i) => Math.max(0, i - 1)),
    []
  )
  const goForward = useCallback(
    () =>
      setCurrentMoveIndex((i) => Math.min(game.positions.length - 1, i + 1)),
    [game.positions.length]
  )

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const averageElo = calculateAverageElo(game.white.elo, game.black.elo)
    if (averageElo === null || !guess) return
    const score = calculateScore(Number(guess), averageElo)
    setResult({ actual: averageElo, score })
    onResult?.(Number(guess), averageElo, score)
  }

  const currentFen = game.positions[currentMoveIndex]!
  const moveLabel =
    currentMoveIndex === 0
      ? 'Start'
      : `Move ${currentMoveIndex} / ${game.moves.length}`

  // Clock computation
  // Lichess clocks array: centiseconds remaining after each move
  // Even indices (0,2,4…) = after White's move; odd (1,3,5…) = after Black's move
  const hasClock = game.clocks.length > 0 && game.initialSeconds !== null
  const initialCs = (game.initialSeconds ?? 0) * 100

  function clockAt(idx: number): number {
    return game.clocks[idx] ?? initialCs
  }

  // At position N: White's last clock is at index ceil(N/2)*2 - 2 (first valid at N≥1)
  // Black's last clock is at index floor(N/2)*2 - 1 (first valid at N≥2)
  const i = currentMoveIndex
  const whiteCs =
    !hasClock || i === 0 ? initialCs : clockAt((Math.ceil(i / 2) - 1) * 2)
  const blackCs =
    !hasClock || i <= 1 ? initialCs : clockAt(Math.floor(i / 2) * 2 - 1)

  function formatCs(cs: number): string {
    const totalSec = Math.floor(cs / 100)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const whiteClock = hasClock ? formatCs(whiteCs) : null
  const blackClock = hasClock ? formatCs(blackCs) : null

  const isAtLastMove = !canGoForward && currentMoveIndex > 0

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
    whiteClock,
    blackClock,
    isAtLastMove,
  }
}

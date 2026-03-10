'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ParsedGame } from '@/lib/chess/parser'

const ChessBoardClient = dynamic(
  () =>
    import('./chess-board-client').then((m) => ({
      default: m.ChessBoardClient,
    })),
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

export function ChessViewer({ game }: Props) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)

  const canGoBack = currentMoveIndex > 0
  const canGoForward = currentMoveIndex < game.positions.length - 1

  const goBack = useCallback(() => {
    setCurrentMoveIndex((i) => Math.max(0, i - 1))
  }, [])

  const goForward = useCallback(() => {
    setCurrentMoveIndex((i) => Math.min(game.positions.length - 1, i + 1))
  }, [game.positions.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goForward()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goBack, goForward])

  const currentFen = game.positions[currentMoveIndex]!
  const moveCount = game.moves.length
  const moveLabel =
    currentMoveIndex === 0 ? 'Start' : `Move ${currentMoveIndex} / ${moveCount}`

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-[95vw] max-w-[560px]">
        <CardHeader>
          <CardTitle className="text-base">
            {game.white.name ?? 'Unknown'} vs {game.black.name ?? 'Unknown'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>
              White:{' '}
              <strong className="text-foreground">
                {game.white.elo ?? '?'}
              </strong>
            </span>
            <span className="capitalize">{game.speed}</span>
            <span>
              Black:{' '}
              <strong className="text-foreground">
                {game.black.elo ?? '?'}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>

      <ChessBoardClient fen={currentFen} />

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          className="size-11"
          onClick={goBack}
          disabled={!canGoBack}
          aria-label="Previous move"
        >
          <ChevronLeft />
        </Button>
        <span className="text-muted-foreground min-w-[120px] text-center text-sm">
          {moveLabel}
        </span>
        <Button
          variant="outline"
          className="size-11"
          onClick={goForward}
          disabled={!canGoForward}
          aria-label="Next move"
        >
          <ChevronRight />
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Use ← → arrow keys to navigate
      </p>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScoreBar } from '@/app/_components/ScoreBar'
import { startRankedSession } from '@/lib/actions/ranked'
import { RANKED_ROUNDS } from '@/lib/chess/scoring'
import type { RoundResult } from '@/lib/dal/game_results'

type Props = {
  ratingBefore: number
  ratingAfter: number
  roundResults: RoundResult[]
}

export function SessionCompleteCard({
  ratingBefore,
  ratingAfter,
  roundResults,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const totalScore = roundResults.reduce((sum, r) => sum + r.score, 0)
  const ratingDelta = ratingAfter - ratingBefore

  function handlePlayAgain() {
    startTransition(async () => {
      const result = await startRankedSession()
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="text-center">
        <Trophy className="text-primary mx-auto mb-2 size-10" />
        <h2 className="text-2xl font-bold">Session Complete!</h2>
      </div>

      {/* Total score */}
      <div className="bg-card border-border w-full rounded-xl border p-4 text-center">
        <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
          Total Score
        </p>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-primary text-3xl font-bold tabular-nums">
            {totalScore.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-sm">
            / {(RANKED_ROUNDS * 5000).toLocaleString()}
          </span>
        </div>
        <div className="mt-2">
          <ScoreBar score={Math.round(totalScore / RANKED_ROUNDS)} />
        </div>
      </div>

      {/* Rating change */}
      <div className="bg-card border-border w-full rounded-xl border p-4">
        <p className="text-muted-foreground mb-3 text-center text-xs tracking-wider uppercase">
          Rating
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold tabular-nums">
            {ratingBefore}
          </span>
          <span
            className={`text-lg font-semibold ${ratingDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {ratingDelta >= 0 ? '+' : ''}
            {ratingDelta}
          </span>
          <span className="text-2xl font-bold tabular-nums">{ratingAfter}</span>
        </div>
      </div>

      {/* Round breakdown */}
      <div className="w-full space-y-1.5">
        <p className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">
          Round Breakdown
        </p>
        {roundResults.map((r) => (
          <div
            key={r.roundNumber}
            className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">Round {r.roundNumber}</span>
            <span className="font-medium tabular-nums">
              {r.score.toLocaleString()}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${r.ratingChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {r.ratingChange >= 0 ? '+' : ''}
              {r.ratingChange}
            </span>
          </div>
        ))}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handlePlayAgain}
        disabled={isPending}
      >
        {isPending ? 'Starting…' : 'Play Again'}
      </Button>
    </div>
  )
}

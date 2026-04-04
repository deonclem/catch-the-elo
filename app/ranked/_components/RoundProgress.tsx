import { Check } from 'lucide-react'
import { RANKED_ROUNDS } from '@/lib/chess/scoring'
import type { RoundResult } from '@/lib/dal/game_results'

type Props = {
  currentRoundIndex: number // 0-based
  roundResults: RoundResult[]
}

export function RoundProgress({ currentRoundIndex, roundResults }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: RANKED_ROUNDS }, (_, i) => {
        const result = roundResults.find((r) => r.roundNumber === i + 1)
        const isCurrent = i === currentRoundIndex && !result
        const isUpcoming = i > currentRoundIndex

        return (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isCurrent
                ? 'bg-primary/10 border-primary/30 border'
                : 'bg-muted/40'
            }`}
          >
            {/* Round indicator */}
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                result
                  ? 'bg-primary text-primary-foreground'
                  : isCurrent
                    ? 'border-primary text-primary border-2'
                    : 'border-muted-foreground/30 text-muted-foreground border-2'
              }`}
            >
              {result ? <Check className="size-3.5" /> : i + 1}
            </div>

            {/* Label + score */}
            <div className="flex flex-1 items-center justify-between">
              <span
                className={
                  isUpcoming ? 'text-muted-foreground' : 'text-foreground'
                }
              >
                Round {i + 1}
              </span>
              {result && (
                <span className="text-muted-foreground tabular-nums">
                  {result.score.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

import type { GameResult } from '@/lib/chess/parser'
import { cn } from '@/lib/utils'
import { Crown, Equal, Flag, Swords, Timer } from 'lucide-react'

type Outcome =
  | 'won'
  | 'lost-checkmate'
  | 'lost-resign'
  | 'lost-timeout'
  | 'draw'

export function playerOutcome(
  color: 'white' | 'black',
  result: GameResult
): Outcome {
  if (result.termination === 'draw') return 'draw'
  if (result.winner === color) return 'won'
  if (result.termination === 'checkmate') return 'lost-checkmate'
  if (result.termination === 'timeout') return 'lost-timeout'
  return 'lost-resign'
}

function OutcomeIcon({ outcome }: { outcome: Outcome }) {
  if (outcome === 'won')
    return (
      <span title="Won">
        <Crown className="size-4 text-amber-500" />
      </span>
    )
  if (outcome === 'lost-checkmate')
    return (
      <span title="Checkmated">
        <Swords className="text-muted-foreground size-4" />
      </span>
    )
  if (outcome === 'lost-resign')
    return (
      <span title="Resigned">
        <Flag className="text-muted-foreground size-4" />
      </span>
    )
  if (outcome === 'lost-timeout')
    return (
      <span title="Ran out of time">
        <Timer className="text-muted-foreground size-4" />
      </span>
    )
  // draw
  return (
    <span title="Draw">
      <Equal className="text-muted-foreground size-4" />
    </span>
  )
}

type Props = {
  color: 'white' | 'black'
  clock?: string | null
  outcome?: Outcome
}

export function PlayerClock({ color, clock, outcome }: Props) {
  if (!clock && !outcome) return null

  return (
    <div className="flex w-full items-center justify-between px-1">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs font-medium capitalize">
          {color}
        </span>
        {outcome && <OutcomeIcon outcome={outcome} />}
      </div>
      {clock && (
        <span
          className={cn(
            'rounded-md border px-2 py-0.5 font-mono text-sm font-semibold tabular-nums',
            color === 'white'
              ? 'border-border bg-card text-foreground'
              : 'border-primary/20 bg-primary/10 text-primary'
          )}
        >
          {clock}
        </span>
      )}
    </div>
  )
}

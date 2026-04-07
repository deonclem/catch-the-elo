'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Swords, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startRankedSession } from '@/lib/actions/ranked'
import { RANKED_ROUNDS } from '@/lib/chess/scoring'

type Props = {
  rating: number
}

export function RankedLobby({ rating }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleStart() {
    startTransition(async () => {
      const result = await startRankedSession()
      // Always refresh — if a session already exists (e.g. opened in another tab),
      // the server will pick it up and transition to RankedGame automatically.
      router.refresh()
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          <span className="from-primary to-primary-end bg-gradient-to-r bg-clip-text text-transparent">
            Ranked
          </span>{' '}
          Mode
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {RANKED_ROUNDS} rounds · your rating is on the line
        </p>
      </div>

      {/* Rating badge */}
      <div className="bg-card border-border flex flex-col items-center gap-1 rounded-2xl border px-10 py-6">
        <TrendingUp className="text-primary mb-1 size-6" />
        <span className="text-muted-foreground text-xs tracking-wider uppercase">
          Your Rating
        </span>
        <span className="text-4xl font-bold tabular-nums">{rating}</span>
      </div>

      {/* How it works */}
      <div className="text-muted-foreground max-w-xs space-y-1.5 text-center text-sm">
        <p>Play {RANKED_ROUNDS} games from the pool.</p>
        <p>Good guesses earn rating — bad ones cost it.</p>
        <p>
          A weaker player gaining the same score as a stronger one earns more.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        size="lg"
        className="gap-2 px-10"
        onClick={handleStart}
        disabled={isPending}
      >
        <Swords className="size-4" />
        {isPending ? 'Starting…' : 'Start Session'}
      </Button>
    </div>
  )
}

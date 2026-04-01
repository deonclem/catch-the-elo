'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  actualElo: number
}

export function PastDayCard({ actualElo }: Props) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="bg-card border-border w-full overflow-hidden rounded-xl border">
      <div className="border-border bg-muted/40 border-b px-4 py-3">
        <span className="text-muted-foreground text-sm font-medium">
          Past game
        </span>
      </div>
      <div className="flex flex-col items-center gap-3 px-4 py-5">
        <p className="text-muted-foreground text-center text-xs">
          You didn&apos;t play this day.
        </p>
        {revealed ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-muted-foreground text-xs">Game Elo</p>
            <p className="text-foreground text-2xl font-bold tabular-nums">
              {actualElo.toLocaleString()}
            </p>
          </div>
        ) : (
          <>
            <p className="text-foreground text-2xl font-bold tabular-nums blur-sm select-none">
              {actualElo.toLocaleString()}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setRevealed(true)}
            >
              <Eye className="size-3.5" />
              Reveal elo
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

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
    <div className="flex flex-col items-center gap-4">
      <p className="text-muted-foreground text-center text-sm">
        You didn&apos;t play this day.
      </p>
      {revealed ? (
        <div className="flex flex-col items-center gap-1">
          <p className="text-muted-foreground text-xs">Game Elo</p>
          <p className="text-foreground text-3xl font-bold tabular-nums">
            {actualElo.toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-foreground text-3xl font-bold tabular-nums blur-sm select-none">
            {actualElo.toLocaleString()}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setRevealed(true)}
          >
            <Eye className="size-3.5" />
            Reveal Elo
          </Button>
        </div>
      )}
    </div>
  )
}

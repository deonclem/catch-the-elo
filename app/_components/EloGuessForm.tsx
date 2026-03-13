'use client'

import { Button } from '@/components/ui/button'

const MIN = 400
const MAX = 2500

type Props = {
  guess: string
  onChange: (value: string) => void
  onSubmit: (e: { preventDefault(): void }) => void
}

export function EloGuessForm({ guess, onChange, onSubmit }: Props) {
  const numericGuess = Number(guess)

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          Your guess
        </p>
        <p className="text-primary text-5xl font-bold tabular-nums">
          {guess ? numericGuess.toLocaleString() : '–'}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={25}
          value={guess || MIN}
          onChange={(e) => onChange(e.target.value)}
          className="accent-primary w-full cursor-pointer"
          aria-label="Elo guess slider"
        />
        <div className="text-muted-foreground flex justify-between text-[10px]">
          <span>400</span>
          <span>1100</span>
          <span>1800</span>
          <span>2500</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={MIN}
          max={MAX}
          value={guess}
          onChange={(e) => onChange(e.target.value)}
          placeholder="or type..."
          className="border-input bg-card focus:border-primary focus:ring-primary/30 h-9 min-w-0 flex-1 rounded-md border px-3 text-center text-sm transition-colors outline-none focus:ring-2"
        />
        <Button type="submit" disabled={!guess} className="h-9 shrink-0 px-4">
          Submit
        </Button>
      </div>
    </form>
  )
}

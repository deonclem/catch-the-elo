'use client'

import { Button } from '@/components/ui/button'

const MIN = 400
const MAX = 2500

type Props = {
  guess: string
  onChange: (value: string) => void
  onSubmit: (e: { preventDefault(): void }) => void
  disabled?: boolean
}

export function EloGuessForm({ guess, onChange, onSubmit, disabled }: Props) {
  const numericGuess = Number(guess)
  const hasValue = guess !== ''
  const isValid = hasValue && numericGuess >= MIN && numericGuess <= MAX
  const showError = hasValue && !isValid

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          Your guess
        </p>
        <p className="text-primary text-5xl font-bold tabular-nums">
          {isValid ? numericGuess.toLocaleString() : '?'}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={25}
          value={isValid ? guess : Math.round((MIN + MAX) / 2)}
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

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={MIN}
            max={MAX}
            value={guess}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="or type..."
            className={`bg-card focus:ring-primary/30 h-9 min-w-0 flex-1 rounded-md border px-3 text-center text-sm transition-colors outline-none focus:ring-2 ${
              showError
                ? 'border-destructive focus:border-destructive'
                : 'border-input focus:border-primary'
            }`}
          />
          <Button
            type="submit"
            disabled={!isValid || disabled}
            className="h-9 shrink-0 px-4"
          >
            Submit
          </Button>
        </div>
        {showError && (
          <p className="text-destructive text-center text-xs">
            Enter a number between {MIN} and {MAX}
          </p>
        )}
      </div>
    </form>
  )
}

'use client'

import { Button } from '@/components/ui/button'

type Props = {
  guess: string
  onChange: (value: string) => void
  onSubmit: (e: { preventDefault(): void }) => void
}

export function EloGuessForm({ guess, onChange, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={100}
        max={3500}
        value={guess}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your Elo guess"
        className="border-input h-11 w-36 rounded-md border bg-transparent px-3 text-center text-sm outline-none"
      />
      <Button type="submit" disabled={!guess} className="h-11 px-4">
        Submit
      </Button>
    </form>
  )
}

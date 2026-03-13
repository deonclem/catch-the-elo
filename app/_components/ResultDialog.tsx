'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScoreBar } from './ScoreBar'
import { generateShareText } from '@/lib/chess/scoring'

type Props = {
  open: boolean
  onClose: () => void
  guess: number
  actual: number
  score: number
  speed: string
  lichessUrl?: string
}

function scoreLabel(score: number): string {
  if (score >= 4500) return 'Perfect!'
  if (score >= 3500) return 'Great!'
  if (score >= 2000) return 'Good'
  if (score >= 1000) return 'Getting there'
  return 'Keep trying'
}

export function ResultDialog({
  open,
  onClose,
  guess,
  actual,
  score,
  speed,
  lichessUrl,
}: Props) {
  const diff = Math.abs(guess - actual)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = generateShareText(guess, actual, score, speed)
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-muted-foreground text-center text-base font-medium">
            {scoreLabel(score)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          {/* Big score */}
          <div className="text-center">
            <p className="text-primary text-4xl font-bold tabular-nums">
              {score.toLocaleString()}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">out of 5,000</p>
          </div>

          {/* Score bar */}
          <ScoreBar score={score} />

          {/* Guess vs actual */}
          <div className="border-border bg-muted/40 w-full rounded-lg border px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your guess</span>
              <span className="font-semibold tabular-nums">
                {guess.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 flex justify-between text-sm">
              <span className="text-muted-foreground">Actual Elo</span>
              <span className="font-semibold tabular-nums">
                {actual.toLocaleString()}
              </span>
            </div>
            <div className="border-border text-muted-foreground mt-2 border-t pt-2 text-center text-xs">
              Off by <span className="text-foreground font-medium">{diff}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full flex-col gap-2">
            <Button onClick={handleCopy} className="w-full gap-2">
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Share result
                </>
              )}
            </Button>
            {lichessUrl && (
              <Button variant="ghost" size="sm" asChild className="gap-1.5">
                <a href={lichessUrl} target="_blank" rel="noopener noreferrer">
                  View on Lichess
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

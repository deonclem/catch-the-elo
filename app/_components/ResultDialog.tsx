'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react'
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
  const tooHigh = guess > actual
  const isPerfect = diff <= 20
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

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Off by — hero */}
          <div className="flex flex-col items-center gap-1">
            {isPerfect ? (
              <p className="text-primary text-5xl font-bold tabular-nums">
                Spot on
              </p>
            ) : (
              <>
                <p className="text-primary text-5xl font-bold tabular-nums">
                  {diff.toLocaleString()}
                </p>
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  {tooHigh ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                  <span>{tooHigh ? 'too high' : 'too low'}</span>
                </div>
              </>
            )}
          </div>

          {/* Guess vs actual */}
          <div className="flex w-full items-center justify-between gap-2">
            <div className="bg-muted/50 flex flex-1 flex-col items-center rounded-lg px-3 py-2.5">
              <span className="text-muted-foreground mb-0.5 text-xs">
                Your guess
              </span>
              <span className="text-foreground text-lg font-bold tabular-nums">
                {guess.toLocaleString()}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">vs</span>
            <div className="bg-muted/50 flex flex-1 flex-col items-center rounded-lg px-3 py-2.5">
              <span className="text-muted-foreground mb-0.5 text-xs">
                Actual Elo
              </span>
              <span className="text-foreground text-lg font-bold tabular-nums">
                {actual.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Score */}
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-primary text-3xl font-bold tabular-nums">
                {score.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-sm">/ 5,000 pts</span>
            </div>
            <ScoreBar score={score} />
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

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScoreBar } from './ScoreBar'
import {
  generateShareText,
  getResultIllustrationSrc,
} from '@/lib/chess/scoring'

type Props = {
  open: boolean
  onClose: () => void
  guess: number
  actual: number
  score: number
  date?: string
  lichessUrl?: string
  ratingChange?: number
  nextLabel?: string
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
  date,
  lichessUrl,
  ratingChange,
  nextLabel,
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = generateShareText(
      score,
      date ?? new Date().toISOString().slice(0, 10)
    )
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
          {/* Illustration */}
          <Image
            src={getResultIllustrationSrc(score)}
            alt={scoreLabel(score)}
            width={180}
            height={180}
            className="rounded-xl"
          />

          {/* Guess vs actual — hero */}
          <div className="flex w-full items-center justify-between gap-2">
            <div className="bg-muted/50 flex flex-1 flex-col items-center rounded-lg px-3 py-4">
              <span className="text-muted-foreground mb-1 text-xs">
                Your guess
              </span>
              <span className="text-foreground text-3xl font-bold tabular-nums">
                {guess.toLocaleString()}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">vs</span>
            <div className="bg-muted/50 flex flex-1 flex-col items-center rounded-lg px-3 py-4">
              <span className="text-muted-foreground mb-1 text-xs">
                Actual Elo
              </span>
              <span className="text-foreground text-3xl font-bold tabular-nums">
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
            {ratingChange !== undefined && (
              <div
                className={`text-sm font-semibold ${ratingChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                {ratingChange >= 0 ? '+' : ''}
                {ratingChange} rating
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex w-full flex-col gap-2">
            {ratingChange !== undefined ? (
              <Button onClick={onClose} className="w-full">
                {nextLabel ?? 'Next Round'}
              </Button>
            ) : (
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
            )}
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

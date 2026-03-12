'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
          <DialogTitle className="text-center">Result</DialogTitle>
          <DialogDescription className="text-center">
            Off by {diff} · {score.toLocaleString()} / 5,000
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="text-muted-foreground text-sm">
            Your guess:{' '}
            <strong className="text-foreground">
              {guess.toLocaleString()}
            </strong>
          </div>
          <div className="text-muted-foreground text-sm">
            Actual Elo:{' '}
            <strong className="text-foreground">
              {actual.toLocaleString()}
            </strong>
          </div>
          <div className="text-2xl font-bold">
            {score.toLocaleString()} / 5,000
          </div>
          <div className="flex gap-1 text-2xl">
            {[1000, 2000, 3000, 4000, 5000].map((tier) => (
              <span key={tier}>{score >= tier ? '🟩' : '⬛'}</span>
            ))}
          </div>
          <Button onClick={handleCopy} variant="outline" className="w-full">
            {copied ? 'Copied to clipboard!' : 'Copy result'}
          </Button>
          {lichessUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={lichessUrl} target="_blank" rel="noopener noreferrer">
                View on Lichess ↗
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

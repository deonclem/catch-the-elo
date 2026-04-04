'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  generateShareText,
  getResultIllustrationSrc,
} from '@/lib/chess/scoring'
import { Check, Copy, ExternalLink, Flame, Swords, Trophy } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ScoreBar } from './ScoreBar'

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
  isLoggedIn?: boolean
}

const SCORE_TIERS: [number, string[]][] = [
  [
    4900,
    [
      'Illegal move.',
      'Please report to your nearest chess federation.',
      'Inhuman!',
      "Suspicious, we're investigating.",
    ],
  ],
  [
    4500,
    [
      'Almost too good.',
      'Your opponents fear you.',
      'Scary accurate.',
      'Save some Elo for the rest of us!',
    ],
  ],
  [
    4000,
    ['Suspiciously accurate.', 'Sharp eye!', 'Uncanny.', 'Elo whisperer.'],
  ],
  [
    3500,
    [
      'Solid read.',
      'Getting scary good.',
      'Almost a GM.',
      "You've done this before.",
    ],
  ],
  [
    3000,
    [
      'Above average.',
      'Respectable.',
      'Not bad at all.',
      'Your inner GM is showing.',
    ],
  ],
  [
    2500,
    [
      'More than a guess.',
      'Decent read.',
      "You're onto something.",
      'Not terrible.',
    ],
  ],
  [
    2000,
    [
      'Could be worse.',
      'You were in the ballpark.',
      'Passable.',
      'Room to grow.',
    ],
  ],
  [
    1500,
    [
      'Chess is hard.',
      'The pieces lied to you.',
      'A bold guess.',
      'The Elo eludes you.',
    ],
  ],
  [
    1000,
    [
      'Rough one.',
      'Back to chess school.',
      'Who hurt you?',
      'The board is mocking you.',
    ],
  ],
  [
    500,
    [
      'Were you even looking?',
      'Questionable.',
      'Bold strategy.',
      'A swing and a miss.',
    ],
  ],
  [
    100,
    [
      'A bold choice.',
      'Even pawns are embarrassed.',
      'Incredible commitment.',
      'The Elo fights back.',
    ],
  ],
  [
    0,
    [
      'Historical.',
      'A new low score has been set.',
      'Did you guess your age?',
      'You need a hug.',
    ],
  ],
]

function scoreLabel(score: number): string {
  const tier = SCORE_TIERS.find(([threshold]) => score >= threshold)
  const labels = tier ? tier[1] : SCORE_TIERS[SCORE_TIERS.length - 1][1]
  return labels[Math.floor(Math.random() * labels.length)]
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
  isLoggedIn = true,
}: Props) {
  const [copied, setCopied] = useState(false)
  const label = useMemo(() => scoreLabel(score), [score])

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
            {label}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Illustration */}
          <Image
            src={getResultIllustrationSrc(score)}
            alt={label}
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

          {/* Sign-up nudge for anonymous users */}
          {!isLoggedIn && (
            <div className="border-border bg-muted/30 w-full rounded-lg border p-3">
              <p className="text-foreground mb-2 text-sm font-semibold">
                Save your results
              </p>
              <ul className="text-muted-foreground mb-3 space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <Flame className="text-primary size-3.5 shrink-0" />
                  Track your daily streak
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="text-primary size-3.5 shrink-0" />
                  Appear on the leaderboard
                </li>
                <li className="flex items-center gap-2">
                  <Swords className="text-primary size-3.5 shrink-0" />
                  Play ranked mode
                </li>
              </ul>
              <Button asChild className="w-full" size="sm">
                <Link href="/auth?tab=signup">Create a free account →</Link>
              </Button>
            </div>
          )}

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

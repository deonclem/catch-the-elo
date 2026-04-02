'use client'

import Image from 'next/image'
import { CheckCircle2, Clock, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScoreBar } from './ScoreBar'
import {
  getResultIllustrationSrc,
  generateShareText,
} from '@/lib/chess/scoring'

type Props = {
  guessElo: number
  actualElo: number
  score: number
  isToday?: boolean
  date?: string
}

function timeUntilNextGame(): string {
  const now = new Date()
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  )
  const diffMs = midnight.getTime() - now.getTime()
  const totalMinutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export function AlreadyPlayedCard({
  guessElo,
  actualElo,
  score,
  isToday = true,
  date,
}: Props) {
  const [copied, setCopied] = useState(false)
  const diff = Math.abs(guessElo - actualElo)
  const timeLeft = timeUntilNextGame()

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
    <div className="border-border bg-card w-full overflow-hidden rounded-xl border">
      {/* Header */}
      <div className="border-border bg-muted/40 flex items-center gap-2 border-b px-4 py-3">
        <CheckCircle2 className="text-primary size-4" />
        <span className="text-sm font-medium">
          {isToday ? 'Already played today' : 'Already played'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-col items-center gap-4 px-4 py-5">
        {/* Illustration */}
        <Image
          src={getResultIllustrationSrc(score)}
          alt=""
          width={120}
          height={120}
          className="rounded-lg"
        />

        {/* Score */}
        <div className="flex items-baseline justify-center gap-1.5 text-center">
          <span className="text-primary text-3xl font-bold tabular-nums">
            {score.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-sm">/ 5,000</span>
        </div>

        <ScoreBar score={score} />

        {/* Guess vs actual */}
        <div className="border-border bg-muted/40 w-full rounded-lg border px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your guess</span>
            <span className="font-semibold tabular-nums">
              {guessElo.toLocaleString()}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-muted-foreground">Actual Elo</span>
            <span className="font-semibold tabular-nums">
              {actualElo.toLocaleString()}
            </span>
          </div>
          <div className="border-border text-muted-foreground mt-2 border-t pt-2 text-center text-xs">
            Off by <span className="text-foreground font-medium">{diff}</span>
          </div>
        </div>

        {/* Share */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleCopy}
        >
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

        {/* Countdown */}
        {isToday && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5" />
            <span>Next game in {timeLeft}</span>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

type Props = {
  guessElo: number
  actualElo: number
  score: number
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

export function AlreadyPlayedCard({ guessElo, actualElo, score }: Props) {
  const diff = Math.abs(guessElo - actualElo)
  const timeLeft = timeUntilNextGame()

  return (
    <div className="border-border bg-card flex w-full flex-col items-center gap-3 rounded-lg border p-4">
      <p className="text-muted-foreground text-sm font-medium">
        ✓ Already played today
      </p>
      <div className="text-muted-foreground text-sm">
        Your guess:{' '}
        <strong className="text-foreground">{guessElo.toLocaleString()}</strong>
      </div>
      <div className="text-muted-foreground text-sm">
        Actual Elo:{' '}
        <strong className="text-foreground">
          {actualElo.toLocaleString()}
        </strong>
      </div>
      <div className="text-muted-foreground text-xs">
        Off by {diff} · {score.toLocaleString()} / 5,000
      </div>
      <div className="flex gap-1 text-xl">
        {[1000, 2000, 3000, 4000, 5000].map((tier) => (
          <span key={tier}>{score >= tier ? '🟩' : '⬛'}</span>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">Next game in {timeLeft}</p>
    </div>
  )
}

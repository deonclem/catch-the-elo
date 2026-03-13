import { cn } from '@/lib/utils'

const TIERS = [1000, 2000, 3000, 4000, 5000]

export function ScoreBar({
  score,
  size = 'md',
}: {
  score: number
  size?: 'sm' | 'md'
}) {
  const filled = TIERS.filter((t) => score >= t).length

  return (
    <div className={cn('flex gap-1', size === 'sm' ? 'w-24' : 'w-40')}>
      {TIERS.map((tier, i) => (
        <div
          key={tier}
          className={cn(
            'flex-1 rounded-sm transition-colors',
            size === 'sm' ? 'h-2' : 'h-3',
            i < filled ? 'bg-primary' : 'bg-muted'
          )}
        />
      ))}
    </div>
  )
}

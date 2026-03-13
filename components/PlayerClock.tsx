import { cn } from '@/lib/utils'

type Props = {
  color: 'white' | 'black'
  clock: string
}

export function PlayerClock({ color, clock }: Props) {
  return (
    <div className="flex w-full items-center justify-between px-1">
      <span className="text-muted-foreground text-xs font-medium capitalize">
        {color}
      </span>
      <span
        className={cn(
          'rounded-md border px-2 py-0.5 font-mono text-sm font-semibold tabular-nums',
          color === 'white'
            ? 'border-border bg-card text-foreground'
            : 'border-primary/20 bg-primary/10 text-primary'
        )}
      >
        {clock}
      </span>
    </div>
  )
}

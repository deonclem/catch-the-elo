'use client'

import { INITIAL_RATING } from '@/lib/chess/scoring'
import type { RankedSessionHistoryEntry } from '@/lib/dal/ranked_sessions'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartPoint = {
  ts: number
  rating: number
}

type TooltipProps = {
  active?: boolean
  payload?: { value: number }[]
  label?: number
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function EloTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length || label === undefined) return null
  return (
    <div className="bg-card border-border rounded-lg border px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground text-xs">{formatDate(label)}</p>
      <p className="font-semibold tabular-nums">{payload[0].value}</p>
    </div>
  )
}

export function EloChart({
  history,
  profileCreatedAt,
}: {
  history: RankedSessionHistoryEntry[]
  profileCreatedAt: string
}) {
  // Keep only the last session per calendar day
  const lastPerDay = new Map<string, RankedSessionHistoryEntry>()
  for (const s of history) {
    const day = s.completedAt.slice(0, 10)
    lastPerDay.set(day, s)
  }

  const data: ChartPoint[] = [
    { ts: new Date(profileCreatedAt).getTime(), rating: INITIAL_RATING },
    ...Array.from(lastPerDay.values()).map((s) => ({
      ts: new Date(s.completedAt).getTime(),
      rating: s.ratingAfter,
    })),
  ]

  const ratings = data.map((d) => d.rating)
  const minRating = Math.min(...ratings)
  const maxRating = Math.max(...ratings)
  const padding = Math.max(50, Math.round((maxRating - minRating) * 0.2))
  const domain: [number, number] = [minRating - padding, maxRating + padding]

  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
        Elo History
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            ticks={data.map((d) => d.ts)}
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={36}
            tickCount={4}
            allowDecimals={false}
          />
          <Tooltip content={<EloTooltip />} />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-primary)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

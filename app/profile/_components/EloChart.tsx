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

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function makeXTicks(minTs: number, maxTs: number, count: number): number[] {
  const span = maxTs - minTs
  if (span === 0) return []
  return Array.from({ length: count }, (_, i) =>
    Math.round(minTs + span * ((i + 1) / (count + 1)))
  )
}

function makeXFormatter(spanMs: number) {
  return (ts: number) => {
    const date = new Date(ts)
    if (spanMs < NINETY_DAYS_MS) {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    })
  }
}

function EloTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length || label === undefined) return null
  const dateLabel = new Date(label).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return (
    <div className="bg-card border-border rounded-lg border px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground text-xs">{dateLabel}</p>
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

  const minTs = data[0].ts
  const maxTs = data[data.length - 1].ts
  const spanMs = maxTs - minTs
  const xTicks = makeXTicks(minTs, maxTs, 3)
  const xFormatter = makeXFormatter(spanMs)

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
            domain={[minTs, maxTs]}
            ticks={xTicks}
            tickFormatter={xFormatter}
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

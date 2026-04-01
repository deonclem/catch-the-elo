import { Flame } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type DayEntry = {
  date: string // 'YYYY-MM-DD'
  gameId: string | null
  isToday: boolean
  played: boolean
  score: number | null
}

type Props = {
  days: DayEntry[]
  streak: number
  isLoggedIn: boolean
  selectedDate: string
}

function formatDay(
  date: string,
  isToday: boolean
): { weekday: string; label: string } {
  const d = new Date(date + 'T00:00:00Z')
  const weekday = isToday
    ? 'Today'
    : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  const label = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return { weekday, label }
}

export function DailyCalendar({
  days,
  streak,
  isLoggedIn,
  selectedDate,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {isLoggedIn && streak > 0 && (
        <div className="border-primary/20 bg-primary/8 text-primary flex items-center gap-1.5 rounded-lg border px-3 py-2">
          <Flame className="size-4 shrink-0" />
          <div>
            <p className="text-xs leading-none font-semibold">
              {streak}-day streak
            </p>
            <p className="text-primary/70 mt-0.5 text-[10px]">Keep it up!</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {days.map((day) => {
          const { weekday, label } = formatDay(day.date, day.isToday)
          const isSelected = day.date === selectedDate

          const rowContent = (
            <>
              {/* Completion dot */}
              <div
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  day.played
                    ? 'bg-primary'
                    : day.gameId
                      ? 'border-muted-foreground/40 border'
                      : 'bg-muted'
                )}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-xs leading-none font-medium',
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {weekday}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[10px] leading-none">
                  {label}
                </p>
              </div>
              {isLoggedIn && day.played && day.score !== null && (
                <span className="text-primary text-[10px] font-semibold tabular-nums">
                  {day.score.toLocaleString()}
                </span>
              )}
            </>
          )

          const rowClass = cn(
            'flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors',
            isSelected && 'bg-primary/10 ring-1 ring-primary/20',
            !isSelected && day.gameId && 'hover:bg-muted/60 cursor-pointer'
          )

          if (!day.gameId) {
            return (
              <div key={day.date} className={rowClass}>
                {rowContent}
              </div>
            )
          }

          return (
            <Link
              key={day.date}
              href={day.isToday ? '/' : `/?date=${day.date}`}
              className={rowClass}
            >
              {rowContent}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

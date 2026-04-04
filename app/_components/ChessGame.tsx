'use client'

import { useChessGame } from '@/hooks/useChessGame'
import { submitDailyResult } from '@/lib/actions/games'
import type { ParsedGame } from '@/lib/chess/parser'
import type { StreakStatus } from '@/lib/dal/profiles'
import { CalendarDays, CheckCircle2, History, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlreadyPlayedCard } from './AlreadyPlayedCard'
import { BoardColumn } from './BoardColumn'
import type { DayEntry } from './DailyCalendar'
import { DailyCalendar } from './DailyCalendar'
import { EloGuessForm } from './EloGuessForm'
import { GuessCard } from './GuessCard'
import { PastDayCard } from './PastDayCard'
import { ResultDialog } from './ResultDialog'

type ExistingResult = {
  guessElo: number
  actualElo: number
  score: number
}

type Props = {
  game: ParsedGame
  dailyGameId?: string
  existingResult?: ExistingResult | null
  recentDays: DayEntry[]
  isLoggedIn: boolean
  streak: number
  streakStatus: StreakStatus
  isToday: boolean
  selectedDate: string
  pastDayElo?: number | null
}

export function ChessGame({
  game,
  dailyGameId,
  existingResult,
  recentDays,
  isLoggedIn,
  streak,
  streakStatus,
  isToday,
  selectedDate,
  pastDayElo,
}: Props) {
  const router = useRouter()
  const [submittedResult, setSubmittedResult] = useState<ExistingResult | null>(
    null
  )
  const [suppressResultDialog, setSuppressResultDialog] = useState(false)

  const onResult = dailyGameId
    ? (guessElo: number, actualElo: number, score: number) => {
        setSubmittedResult({ guessElo, actualElo, score })
        document.cookie = `dte_daily_result=${encodeURIComponent(JSON.stringify({ gameId: dailyGameId, guessElo, actualElo, score }))}; max-age=${60 * 60 * 48}; path=/; SameSite=Strict`
        submitDailyResult(dailyGameId, guessElo, actualElo, score)
          .then(({ alreadySubmitted }) => {
            if (alreadySubmitted) {
              setSuppressResultDialog(true)
            }
            router.refresh()
          })
          .catch(() => {})
      }
    : undefined

  const {
    guess,
    setGuess,
    result,
    setResult,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    handleSubmit,
    currentFen,
    moveLabel,
    whiteClock,
    blackClock,
    isAtLastMove,
  } = useChessGame(game, onResult)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goForward()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [goBack, goForward])

  const shownResult = existingResult ?? submittedResult

  const cardMeta = shownResult
    ? { Icon: CheckCircle2, title: 'Your Result', iconClass: 'text-primary' }
    : isToday
      ? { Icon: Target, title: 'Make Your Guess', iconClass: 'text-primary' }
      : {
          Icon: History,
          title: 'Past Game',
          iconClass: 'text-muted-foreground',
        }

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
      {/* Left column — history card (desktop only) */}
      <div className="bg-card border-border hidden w-[220px] shrink-0 overflow-hidden rounded-xl border lg:block">
        <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
          <CalendarDays className="text-muted-foreground size-4" />
          <h2 className="text-sm font-semibold">This Week</h2>
        </div>
        <div className="p-3">
          <DailyCalendar
            days={recentDays}
            streak={streak}
            streakStatus={streakStatus}
            isLoggedIn={isLoggedIn}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      {/* Middle column — board */}
      <BoardColumn
        game={game}
        currentFen={currentFen}
        whiteClock={whiteClock}
        blackClock={blackClock}
        isAtLastMove={isAtLastMove}
        header={
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              <span className="from-primary to-primary-end bg-gradient-to-r bg-clip-text text-transparent">
                Daily
              </span>{' '}
              Challenge
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isToday
                ? "Guess the average Elo of today's game"
                : `Viewing ${new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}`}
            </p>
          </div>
        }
      />

      {/* Right column — guess card */}
      <GuessCard
        Icon={cardMeta.Icon}
        iconClass={cardMeta.iconClass}
        title={cardMeta.title}
        moveLabel={moveLabel}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
      >
        {shownResult ? (
          <AlreadyPlayedCard
            {...shownResult}
            isToday={isToday}
            date={selectedDate}
          />
        ) : isToday ? (
          result === null && (
            <EloGuessForm
              guess={guess}
              onChange={setGuess}
              onSubmit={handleSubmit}
            />
          )
        ) : pastDayElo != null ? (
          <PastDayCard key={selectedDate} actualElo={pastDayElo} />
        ) : null}
      </GuessCard>

      {result !== null && !suppressResultDialog && (
        <ResultDialog
          open={true}
          onClose={() => setResult(null)}
          guess={Number(guess)}
          actual={result.actual}
          score={result.score}
          date={selectedDate}
          lichessUrl={game.id ? `https://lichess.org/${game.id}` : undefined}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  )
}

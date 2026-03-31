'use client'

import { useChessGame } from '@/hooks/useChessGame'
import { submitDailyResult } from '@/lib/actions/games'
import type { ParsedGame } from '@/lib/chess/parser'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlreadyPlayedCard } from './AlreadyPlayedCard'
import type { DayEntry } from './DailyCalendar'
import { DailyCalendar } from './DailyCalendar'
import { EloGuessForm } from './EloGuessForm'
import { GameInfoCard } from './GameInfoCard'
import { MoveNavigator } from './MoveNavigator'
import { PlayerClock, playerOutcome } from './PlayerClock'
import { ResultDialog } from './ResultDialog'

const ChessBoardClient = dynamic(
  () =>
    import('./ChessBoardClient').then((m) => ({ default: m.ChessBoardClient })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted aspect-square w-[85vw] max-w-[504px] animate-pulse rounded-xl" />
    ),
  }
)

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
}

export function ChessGame({
  game,
  dailyGameId,
  existingResult,
  recentDays,
  isLoggedIn,
  streak,
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

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
      {/* Left column — calendar (desktop only) */}
      <div className="hidden w-[180px] shrink-0 lg:block">
        <DailyCalendar
          days={recentDays}
          streak={streak}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Middle column — board */}
      <div className="flex w-[85vw] max-w-[504px] shrink-0 flex-col items-center gap-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            <span className="from-primary to-primary-end bg-gradient-to-r bg-clip-text text-transparent">
              Daily
            </span>{' '}
            Challenge
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Guess the average Elo of today&apos;s game
          </p>
        </div>
        <GameInfoCard timeControl={game.timeControl} />
        <PlayerClock
          color="black"
          clock={blackClock}
          outcome={
            isAtLastMove ? playerOutcome('black', game.result) : undefined
          }
        />
        <ChessBoardClient fen={currentFen} />
        <PlayerClock
          color="white"
          clock={whiteClock}
          outcome={
            isAtLastMove ? playerOutcome('white', game.result) : undefined
          }
        />
        <MoveNavigator
          moveLabel={moveLabel}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={goBack}
          onForward={goForward}
        />
        <p className="text-muted-foreground text-xs">
          Use ← → arrow keys to navigate
        </p>
      </div>

      {/* Right column — guess form or result */}
      <div className="w-full max-w-[280px] shrink-0 lg:w-[220px]">
        {shownResult ? (
          <AlreadyPlayedCard {...shownResult} />
        ) : (
          result === null && (
            <EloGuessForm
              guess={guess}
              onChange={setGuess}
              onSubmit={handleSubmit}
            />
          )
        )}
      </div>

      {result !== null && !suppressResultDialog && (
        <ResultDialog
          open={true}
          onClose={() => setResult(null)}
          guess={Number(guess)}
          actual={result.actual}
          score={result.score}
          speed={game.timeControl}
          lichessUrl={game.id ? `https://lichess.org/${game.id}` : undefined}
        />
      )}
    </div>
  )
}

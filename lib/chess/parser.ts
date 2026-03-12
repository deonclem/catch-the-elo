import { Chess } from 'chess.js'
import { z } from 'zod'
import type { LichessGame } from '@/lib/services/lichess'
import type { Tables } from '@/lib/database.types'

export type PlayerInfo = {
  name: string | null
  elo: number | null
}

export type ParsedGame = {
  id: string
  // FEN strings: index 0 = starting position, index N = position after move N-1
  positions: string[]
  // SAN notation for each move; moves.length === positions.length - 1
  moves: string[]
  white: PlayerInfo
  black: PlayerInfo
  timeControl: string
  // Initial clock in seconds (from time control)
  initialSeconds: number | null
  // Remaining time in centiseconds after each move (White: even indices 0,2,4…; Black: odd 1,3,5…)
  clocks: number[]
}

function formatTimeControl(initial: number, increment: number): string {
  const minutes = initial / 60
  const base = Number.isInteger(minutes) ? String(minutes) : `${initial}s`
  return `${base}+${increment}`
}

const MetadataSchema = z.object({
  white_name: z.string().optional(),
  black_name: z.string().optional(),
  time_control: z.string().optional(),
})

export function parseDailyGame(row: Tables<'daily_games'>): ParsedGame {
  const chess = new Chess()
  chess.loadPgn(row.pgn)
  const moves = chess.history()

  // Extract [%clk H:MM:SS] → centiseconds, preserving ply order
  const clocks: number[] = []
  const clockRe = /\[%clk\s+(\d+):(\d+):(\d+)\]/g
  let m
  while ((m = clockRe.exec(row.pgn)) !== null) {
    clocks.push(
      (parseInt(m[1]!) * 3600 + parseInt(m[2]!) * 60 + parseInt(m[3]!)) * 100
    )
  }

  // Replay from start to collect all FEN positions
  chess.reset()
  const positions: string[] = [chess.fen()]
  for (const san of moves) {
    chess.move(san)
    positions.push(chess.fen())
  }

  const metadata = MetadataSchema.parse(row.metadata)

  // Parse "600+0" → initialSeconds + display string
  let initialSeconds: number | null = null
  let timeControl = 'Rapid'
  const tc = metadata.time_control?.match(/^(\d+)\+(\d+)$/)
  if (tc) {
    initialSeconds = parseInt(tc[1]!)
    timeControl = formatTimeControl(parseInt(tc[1]!), parseInt(tc[2]!))
  }

  return {
    id: row.lichess_id ?? row.id,
    positions,
    moves,
    white: { name: metadata.white_name ?? null, elo: row.white_elo },
    black: { name: metadata.black_name ?? null, elo: row.black_elo },
    timeControl,
    initialSeconds,
    clocks,
  }
}

export function parseGame(game: LichessGame): ParsedGame {
  const chess = new Chess()
  const positions: string[] = [chess.fen()]
  const moves: string[] = []

  for (const san of game.moves.trim().split(/\s+/)) {
    chess.move(san)
    positions.push(chess.fen())
    moves.push(san)
  }

  return {
    id: game.id,
    positions,
    moves,
    white: {
      name: game.players.white.user?.name ?? null,
      elo: game.players.white.rating ?? null,
    },
    black: {
      name: game.players.black.user?.name ?? null,
      elo: game.players.black.rating ?? null,
    },
    timeControl: game.clock
      ? formatTimeControl(game.clock.initial, game.clock.increment)
      : game.speed,
    initialSeconds: game.clock?.initial ?? null,
    clocks: game.clocks ?? [],
  }
}

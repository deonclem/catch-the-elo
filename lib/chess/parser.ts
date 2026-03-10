import { Chess } from 'chess.js'
import type { LichessGame } from '@/lib/services/lichess'

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
  speed: string
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
    speed: game.speed,
  }
}

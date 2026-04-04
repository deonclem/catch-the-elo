import {
  ChessBishop,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getMaterial } from '@/lib/chess/material'

type PieceKey = 'q' | 'r' | 'b' | 'n' | 'p'

const PIECE_ICONS: Record<PieceKey, LucideIcon> = {
  q: ChessQueen,
  r: ChessRook,
  b: ChessBishop,
  n: ChessKnight,
  p: ChessPawn,
}

// Most to least valuable
const PIECE_ORDER: PieceKey[] = ['q', 'r', 'b', 'n', 'p']

type Props = {
  color: 'white' | 'black'
  fen: string
}

export function MaterialDisplay({ color, fen }: Props) {
  const { whiteCaptured, blackCaptured, materialDiff } = getMaterial(fen)

  // Show what this player has captured (opponent's pieces)
  const captured = color === 'white' ? whiteCaptured : blackCaptured
  const isAhead = color === 'white' ? materialDiff > 0 : materialDiff < 0
  const advantage = Math.abs(materialDiff)

  const pieces: PieceKey[] = PIECE_ORDER.flatMap((p) =>
    Array<PieceKey>(captured[p]).fill(p)
  )

  if (pieces.length === 0 && !isAhead) return null

  return (
    <div className="flex items-center gap-0.5">
      {pieces.map((piece, i) => {
        const Icon = PIECE_ICONS[piece]
        return (
          <Icon
            key={i}
            className="text-muted-foreground size-3"
            strokeWidth={1.5}
          />
        )
      })}
      {isAhead && advantage > 0 && (
        <span className="text-muted-foreground ml-0.5 text-[10px] font-medium">
          +{advantage}
        </span>
      )}
    </div>
  )
}

'use client'

import { Chessboard } from 'react-chessboard'

type Props = {
  fen: string
}

// Safe to read window here — this module is never SSR'd (imported via dynamic with ssr:false)
const boardWidth = Math.min(window.innerWidth * 0.95, 560)

export function ChessBoardClient({ fen }: Props) {
  return (
    <Chessboard
      options={{
        position: fen,
        allowDragging: false,
        boardStyle: { width: boardWidth, height: boardWidth },
      }}
    />
  )
}

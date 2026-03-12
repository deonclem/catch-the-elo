'use client'

import { Chessboard } from 'react-chessboard'

type Props = {
  fen: string
}

// Safe to read window here — this module is never SSR'd (imported via dynamic with ssr:false)
const boardWidth = Math.min(window.innerWidth * 0.85, 504)

export function ChessBoardClient({ fen }: Props) {
  return (
    <Chessboard
      options={{
        position: fen,
        allowDragging: false,
        boardStyle: {
          width: boardWidth,
          height: boardWidth,
          borderRadius: '4px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        },
        lightSquareStyle: { backgroundColor: '#eeeed2' },
        darkSquareStyle: { backgroundColor: '#769656' },
      }}
    />
  )
}

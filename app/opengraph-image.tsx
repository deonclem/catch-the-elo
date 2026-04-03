import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Gueslo — Guess the Elo'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#09090b',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <span style={{ fontSize: '72px' }}>♟</span>
        <span
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-2px',
          }}
        >
          Gueslo
        </span>
      </div>
      <p
        style={{
          fontSize: '32px',
          color: '#a1a1aa',
          margin: 0,
          letterSpacing: '-0.5px',
        }}
      >
        Can you guess the Elo?
      </p>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '8px',
        }}
      >
        {['Daily Challenge', 'Ranked Mode', 'Leaderboards'].map((label) => (
          <span
            key={label}
            style={{
              fontSize: '20px',
              color: '#52525b',
              padding: '8px 20px',
              border: '1px solid #27272a',
              borderRadius: '9999px',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>,
    size
  )
}

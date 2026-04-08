import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Gueslo - Guess the Elo'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gueslo.app'

  return new ImageResponse(
    <div
      style={{
        background: '#faf8ff',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '60px 72px',
        gap: '56px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Left: branding */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          gap: '20px',
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <img
            src={`${baseUrl}/logo.png`}
            alt=""
            width={80}
            height={80}
            style={{ borderRadius: '18px' }}
          />
          <span
            style={{
              fontSize: '88px',
              fontWeight: 800,
              color: '#5b21b6',
              letterSpacing: '-4px',
              lineHeight: 1,
            }}
          >
            Gueslo
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: '40px',
            fontWeight: 600,
            color: '#18181b',
            margin: 0,
            letterSpacing: '-1px',
          }}
        >
          Can you guess the Elo?
        </p>

        {/* Sub-tagline */}
        <p
          style={{
            fontSize: '26px',
            color: '#71717a',
            margin: 0,
            letterSpacing: '-0.3px',
          }}
        >
          Daily challenge · Ranked mode
        </p>
      </div>

      {/* Right: slider + board */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '64px',
          flexShrink: 0,
        }}
      >
        {/* Vertical Elo slider — decorative */}
        <div
          style={{
            position: 'relative',
            width: 108,
            height: 368,
            display: 'flex',
          }}
        >
          {/* Track background */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 14,
              height: 368,
              background: '#ede9f6',
              borderRadius: 7,
            }}
          />
          {/* Fill (1250 ≈ 35% from bottom) */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 14,
              height: 130,
              background: '#7261b3',
              borderRadius: 7,
            }}
          />
          {/* Thumb dot */}
          <div
            style={{
              position: 'absolute',
              right: -5,
              bottom: 120,
              width: 24,
              height: 24,
              background: '#5b21b6',
              borderRadius: 12,
              boxShadow: '0 0 0 3px white',
            }}
          />
          {/* Connector line */}
          <div
            style={{
              position: 'absolute',
              right: 14,
              bottom: 131,
              width: 58,
              height: 2,
              background: '#5b21b6',
              opacity: 0.5,
            }}
          />
          {/* Badge */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 110,
              background: '#5b21b6',
              color: 'white',
              borderRadius: 10,
              padding: '5px 10px',
              fontSize: 19,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            1250 ?
          </div>
        </div>

        {/* Board */}
        <img
          src={`${baseUrl}/example_board.png`}
          alt=""
          width={368}
          height={368}
          style={{
            borderRadius: '14px',
            boxShadow: '0 24px 64px rgba(91, 33, 182, 0.2)',
          }}
        />
      </div>
    </div>,
    size
  )
}

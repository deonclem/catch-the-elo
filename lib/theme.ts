/**
 * Theme constants for values that can't be driven by CSS variables
 * (e.g. inline styles passed to third-party components like react-chessboard).
 *
 * When changing the theme hue in app/globals.css, update the board
 * square colors below to match.
 *
 * Tip: pick colors close to these oklch approximations —
 *   light squares: oklch(0.93 0.04 <hue>)
 *   dark squares:  oklch(0.50 0.20 <hue>)
 */
export const boardColors = {
  light: '#ede9f6', // ~oklch(0.93 0.04 265) — soft purple
  dark: '#7261b3', //  ~oklch(0.50 0.20 290) — purple
}
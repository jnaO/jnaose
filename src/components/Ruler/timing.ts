import type React from 'react'

// THE ruler choreography, in ms. Ruler hands these to its SCSS as
// inline custom properties; startScene holds the page swap for
// RULER.outMs. Staggers are spread over a fixed span whatever the
// item count, so outMs does not depend on it.
const IN = {
  // The ruler is uncovered top-down, linearly.
  scaleMs: 600,
  // Each long tick grows this long after the uncovering edge reaches
  // its row, so ticks go top-first, carried by the ruler.
  tickLagMs: 60,
  tickMs: 450,
  // Each number/name writes out after its own tick starts.
  labelLagMs: 200,
  labelMs: 250,
  // The needle springs out once the current tick lands.
  needleMs: 450
}

const OUT = {
  // Labels un-write bottom-first; the needle retracts with its label.
  labelSpanMs: 150,
  labelMs: 200,
  // Ticks retract into the scale bottom-first.
  tickDelayMs: 120,
  tickSpanMs: 150,
  tickMs: 300,
  // The ruler is covered bottom-up, ending the OUT.
  scaleDelayMs: 300,
  scaleMs: 450
}

export const RULER = {
  in: IN,
  out: OUT,
  outMs: OUT.scaleDelayMs + OUT.scaleMs
}

// Index `i` of `count` spread over 0 → 1.
export const share = (i: number, count: number) =>
  count > 1 ? i / (count - 1) : 0

// Per-row delays: IN runs top-first, OUT bottom-first.
export function rowDelays(i: number, count: number) {
  const fromBottom = share(count - 1 - i, count)
  // The uncovering edge reaches row i's centre at about this share.
  const reached = count > 0 ? (i + 0.5) / count : 0
  const tickIn = reached * IN.scaleMs + IN.tickLagMs
  return {
    tickIn,
    labelIn: tickIn + IN.labelLagMs,
    labelOut: fromBottom * OUT.labelSpanMs,
    tickOut: OUT.tickDelayMs + fromBottom * OUT.tickSpanMs
  }
}

// The needle's delays when row `i` is current.
export function needleDelays(i: number, count: number) {
  const { tickIn, labelOut } = rowDelays(i, count)
  return { in: tickIn + IN.tickMs, out: labelOut }
}

const ms = (value: number) => `${value}ms`

// Durations for the Ruler's nav.
export const RULER_VARS = {
  '--scale-in': ms(IN.scaleMs),
  '--tick-in': ms(IN.tickMs),
  '--label-in': ms(IN.labelMs),
  '--needle-in': ms(IN.needleMs),
  '--label-out': ms(OUT.labelMs),
  '--tick-out': ms(OUT.tickMs),
  '--scale-out-delay': ms(OUT.scaleDelayMs),
  '--scale-out': ms(OUT.scaleMs)
} as React.CSSProperties

// Delays for row `i` of `count`.
export function rowVars(i: number, count: number) {
  const d = rowDelays(i, count)
  return {
    '--tick-in-delay': ms(d.tickIn),
    '--label-in-delay': ms(d.labelIn),
    '--label-out-delay': ms(d.labelOut),
    '--tick-out-delay': ms(d.tickOut)
  } as React.CSSProperties
}

// Delays for the needle when row `i` of `count` is current.
export function needleVars(i: number, count: number) {
  const d = needleDelays(i, count)
  return {
    '--needle-in-delay': ms(d.in),
    '--needle-out-delay': ms(d.out)
  } as React.CSSProperties
}

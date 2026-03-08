import type { Line } from './types.js'

const calcDuration = (line: Line, now: number): number => {
  return line.durationMs ? line.durationMs : now - line.startedAt
}

export { calcDuration }

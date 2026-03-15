import type { Line } from './types.js'

const calcDuration = (
  line: Pick<Line, 'durationMs' | 'startedAt'>,
  now: number,
): number => {
  return line.durationMs ? line.durationMs : now - line.startedAt
}

export { calcDuration }

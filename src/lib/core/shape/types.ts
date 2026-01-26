import type { Simplify } from 'type-fest'

import type { Point } from '#lib/types.local.js'

type Line = Simplify<
  Point & {
    stoppedAt: number | undefined
    durationMs: number
  }
>

type Slice = {
  startedAt: number
  lineList: Line[]
}

export type { Line, Slice }

import type { Simplify } from 'type-fest'

import type { Point } from '#lib/types.local.js'

type Line = Simplify<
  Point & {
    stoppedAt: number | undefined
    durationMs: number | undefined
  }
>

export type { Line }

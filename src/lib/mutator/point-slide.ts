import type { AnonPoint } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const pointSlide: LocalMutator<'point_slide'> = async (context, options) => {
  const { tx } = context
  const { pointId, startedAt } = options

  const key = Key.point.encode(pointId)
  const point = await tx.get<AnonPoint>(key)
  if (!point) {
    return new Error('Point not found')
  }

  const value: AnonPoint = {
    ...point,
    startedAt,
  }
  await tx.set(key, value)
}

export default pointSlide

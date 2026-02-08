import type { AnonPoint } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const pointSetDescription: LocalMutator<'point_setDescription'> = async (
  context,
  options,
) => {
  const { tx } = context
  const { pointId, description } = options

  const key = Key.point.encode(pointId)
  const point = await tx.get<AnonPoint>(key)
  if (!point) {
    return new Error('Point not found')
  }

  const value: AnonPoint = {
    ...point,
    description,
  }
  await tx.set(key, value)
}

export default pointSetDescription

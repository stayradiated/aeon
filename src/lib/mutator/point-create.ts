import type { AnonPoint } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const pointCreate: LocalMutator<'point_create'> = async (context, options) => {
  const { tx } = context
  const { pointId, streamId, labelIdList, description, startedAt } = options

  const key = Key.point.encode(pointId)
  const value: AnonPoint = {
    streamId,
    labelIdList,
    description,
    startedAt,
  }
  await tx.set(key, value)
}

export default pointCreate

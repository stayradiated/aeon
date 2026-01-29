import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const pointDelete: LocalMutator<'point_delete'> = async (context, options) => {
  const { tx } = context
  const { pointId } = options

  const key = Key.point.encode(pointId)
  await tx.del(key)
}

export default pointDelete

import type { AnonPoint } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const pointCreate: LocalMutator<'point_create'> = async (context, options) => {
  const { tx } = context
  const { pointId, streamId, labelIdList, description, startedAt } = options

  /* NOTE:
   * I have made the decision NOT to t check for existing points here. We could
   * iterate over all points and delete existing points from the store, but
   * this is not performant with 10k+ points.
   *
   * Ideally Replicache would support indexes on numbers (currently only
   * supports indexing string values) - then we can could use an index to
   * quickly identify if a point exists.
   */

  // insert the new point
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

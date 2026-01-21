import type { ServerMutator } from './types.ts'

import { updatePoint } from '#lib/server/db/point/update-point.js'

const pointSlide: ServerMutator<'point_slide'> = async (context, options) => {
  const { db } = context
  const { pointId, startedAt } = options

  const result = await updatePoint({
    db,
    where: {
      userId: context.sessionUserId,
      pointId,
    },
    set: {
      startedAt,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default pointSlide

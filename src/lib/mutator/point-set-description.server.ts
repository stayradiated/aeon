import type { ServerMutator } from './types.ts'

import { updatePoint } from '#lib/server/db/point/update-point.js'

const pointSetDescription: ServerMutator<'point_setDescription'> = async (
  context,
  options,
) => {
  const { db } = context
  const { pointId, description } = options

  const result = await updatePoint({
    db,
    where: {
      userId: context.sessionUserId,
      pointId,
    },
    set: {
      description,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default pointSetDescription

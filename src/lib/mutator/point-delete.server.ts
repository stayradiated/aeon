import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { bulkDeletePoint } from '#lib/server/db/point/bulk-delete-point.js'

const pointDelete: ServerMutator<'point_delete'> = async (context, options) => {
  const { db } = context
  const { pointId } = options

  const result = await bulkDeletePoint({
    db,
    where: {
      userId: context.sessionUserId,
      pointId,
    },
  })
  if (result instanceof Error) {
    return result
  }

  await scheduleUpdateUserStatus({ userId: context.sessionUserId })
}

export default pointDelete

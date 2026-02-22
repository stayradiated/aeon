import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { upsertPoint } from '#lib/server/db/point/upsert-point.js'

const point_create: ServerMutator<'point_create'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { streamId, pointId, startedAt, labelIdList, description } = options

  const point = await upsertPoint({
    db,
    where: {
      userId: sessionUserId,
      streamId,
      startedAt,
    },
    insert: {
      pointId,
    },
    set: {
      description,
      labelIdList,
    },
  })
  if (point instanceof Error) {
    return point
  }

  await scheduleUpdateUserStatus({ userId: sessionUserId })
}

export default point_create

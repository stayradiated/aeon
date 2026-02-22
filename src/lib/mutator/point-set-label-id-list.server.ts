import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { updatePoint } from '#lib/server/db/point/update-point.js'

const pointSetLabelIdList: ServerMutator<'point_setLabelIdList'> = async (
  context,
  options,
) => {
  const { db } = context
  const { pointId, labelIdList } = options

  const result = await updatePoint({
    db,
    where: {
      userId: context.sessionUserId,
      pointId,
    },
    set: {
      labelIdList,
    },
  })
  if (result instanceof Error) {
    return result
  }

  await scheduleUpdateUserStatus({ userId: context.sessionUserId })
}

export default pointSetLabelIdList

import type { ServerMutator } from './types.js'

import { bulkDeleteLabel } from '#lib/server/db/label/bulk-delete-label.js'
import { bulkDeletePoint } from '#lib/server/db/point/bulk-delete-point.js'
import { bulkDeleteStream } from '#lib/server/db/stream/bulk-delete-stream.js'

const dangerDeleteAllData: ServerMutator<'danger_deleteAllData'> = async (
  context,
  options,
) => {
  const { db } = context
  const { userHasConfirmed } = options

  if (!userHasConfirmed) {
    throw new Error('User has not confirmed deletion')
  }

  const deletePointResult = await bulkDeletePoint({
    db,
    where: {
      userId: context.sessionUserId,
    },
  })
  if (deletePointResult instanceof Error) {
    throw deletePointResult
  }

  const deleteLabelResult = await bulkDeleteLabel({
    db,
    where: {
      userId: context.sessionUserId,
    },
  })
  if (deleteLabelResult instanceof Error) {
    throw deleteLabelResult
  }

  const deleteStreamResult = await bulkDeleteStream({
    db,
    where: {
      userId: context.sessionUserId,
    },
  })
  if (deleteStreamResult instanceof Error) {
    throw deleteStreamResult
  }

  console.info({
    point: deletePointResult,
    label: deleteLabelResult,
    stream: deleteStreamResult,
  })
}

export default dangerDeleteAllData

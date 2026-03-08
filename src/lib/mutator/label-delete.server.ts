import type { ServerMutator } from './types.js'

import { bulkDeleteLabel } from '#lib/server/db/label/bulk-delete-label.js'
import { bulkDeletePointLabel } from '#lib/server/db/point/bulk-delete-point-label.js'

const label_delete: ServerMutator<'label_delete'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { labelId } = options

  const deletePointLabelResult = await bulkDeletePointLabel({
    db,
    where: {
      labelId,
      userId: sessionUserId,
    },
  })
  if (deletePointLabelResult instanceof Error) {
    return deletePointLabelResult
  }

  const deleteLabelResult = await bulkDeleteLabel({
    db,
    where: {
      labelId,
      userId: sessionUserId,
    },
  })
  if (deleteLabelResult instanceof Error) {
    return deleteLabelResult
  }
}

export default label_delete

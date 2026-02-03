import type { ServerMutator } from './types.ts'

import { insertLabel } from '#lib/server/db/label/insert-label.js'

const label_create: ServerMutator<'label_create'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { labelId, streamId, parentLabelIdList, name, icon, color } = options

  const label = await insertLabel({
    db,
    set: {
      id: labelId,
      userId: sessionUserId,
      streamId,
      name,
      parentLabelIdList,
      icon: icon ?? null,
      color: color ?? null,
    },
  })
  if (label instanceof Error) {
    return label
  }
}

export default label_create

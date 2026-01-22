import type { ServerMutator } from './types.ts'

import { updateLabel } from '#lib/server/db/label/update-label.js'

const labelSetColor: ServerMutator<'label_setColor'> = async (
  context,
  options,
) => {
  const { db } = context
  const { labelId, color } = options

  const result = await updateLabel({
    db,
    where: {
      userId: context.sessionUserId,
      labelId,
    },
    set: {
      color: color ?? null,
    },
  })
  if (result instanceof Error) {
    return result
  }
}

export default labelSetColor

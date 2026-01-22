import type { AnonLabel } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const labelSetParent: LocalMutator<'label_setParent'> = async (
  context,
  options,
) => {
  const { tx, actionedAt } = context
  const { labelId, parentId } = options

  const key = Key.label.encode(labelId)
  const label = await tx.get<AnonLabel>(key)
  if (!label) {
    return new Error('Label not found')
  }

  const value: AnonLabel = {
    ...label,
    parentId,
    updatedAt: actionedAt,
  }
  await tx.set(key, value)
}

export default labelSetParent

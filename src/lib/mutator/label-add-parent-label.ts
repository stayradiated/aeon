import type { AnonLabel } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const labelAddParentLabel: LocalMutator<'label_addParentLabel'> = async (
  context,
  options,
) => {
  const { tx } = context
  const { labelId, parentLabelId } = options

  const key = Key.label.encode(labelId)
  const label = await tx.get<AnonLabel>(key)
  if (!label) {
    return new Error('Label not found')
  }

  if (label.parentLabelIdList.includes(parentLabelId)) {
    // parent label already exists
    return
  }

  const parentLabelIdList = [...label.parentLabelIdList, parentLabelId]

  const value: AnonLabel = {
    ...label,
    parentLabelIdList,
  }
  await tx.set(key, value)
}

export default labelAddParentLabel

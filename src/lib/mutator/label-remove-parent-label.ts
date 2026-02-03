import type { AnonLabel } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const labelRemoveParentLabel: LocalMutator<'label_removeParentLabel'> = async (
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

  const index = label.parentLabelIdList.indexOf(parentLabelId)
  if (index === -1) {
    // parent label not found
    return
  }

  // remove the parent label from the list
  const parentLabelIdList = label.parentLabelIdList.toSpliced(index, 1)

  const value: AnonLabel = {
    ...label,
    parentLabelIdList,
  }
  await tx.set(key, value)
}

export default labelRemoveParentLabel

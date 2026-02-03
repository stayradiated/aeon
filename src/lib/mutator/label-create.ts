import type { AnonLabel } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

import { deleteUndefinedKeys } from '#lib/utils/delete-undefined-keys.js'

const labelCreate: LocalMutator<'label_create'> = async (context, options) => {
  const { tx } = context
  const { labelId, streamId, parentLabelIdList, name, color, icon } = options

  const key = Key.label.encode(labelId)
  const value: AnonLabel = deleteUndefinedKeys({
    name,
    streamId,
    color,
    icon,
    parentLabelIdList,
  })
  await tx.set(key, value)
}

export default labelCreate

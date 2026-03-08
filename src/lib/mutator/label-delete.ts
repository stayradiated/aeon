import type { LocalMutator } from './types.js'

import * as Key from '#lib/core/replicache/keys.js'

const labelDelete: LocalMutator<'label_delete'> = async (context, options) => {
  const { tx } = context
  const { labelId } = options

  const key = Key.label.encode(labelId)
  await tx.del(key)

  // TODO: identify all points with label and remove those as well
}

export default labelDelete

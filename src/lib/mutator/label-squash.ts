import type { AnonLabel } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const labelSquash: LocalMutator<'label_squash'> = async (context, options) => {
  const { tx } = context
  const { sourceLabelIdList, destinationLabelId } = options

  // validate that the destination is not in the source list
  if (sourceLabelIdList.includes(destinationLabelId)) {
    return new Error('Destination label cannot be in source list')
  }

  const destinationKey = Key.label.encode(destinationLabelId)
  const destinationLabel = await tx.get<AnonLabel>(destinationKey)
  if (!destinationLabel) {
    return new Error(`Destination label not found: ${destinationLabelId}`)
  }

  for (const sourceLabelId of sourceLabelIdList) {
    const sourceKey = Key.label.encode(sourceLabelId)
    const sourceLabel = await tx.get<AnonLabel>(sourceKey)
    if (!sourceLabel) {
      return new Error(`Source label not found: ${sourceLabelId}`)
    }

    // ensure they are in the same stream
    if (sourceLabel.streamId !== destinationLabel.streamId) {
      return new Error(
        'Source and destination labels must be in the same stream',
      )
    }

    // remove the source label
    await tx.del(sourceKey)
  }
}

export default labelSquash

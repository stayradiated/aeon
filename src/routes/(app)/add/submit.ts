import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId, StreamId } from '#lib/ids.js'
import type { StreamState } from './StreamStatus.svelte'

import { goto } from '$app/navigation'

import { genId } from '#lib/utils/gen-id.js'
import { objectEntries } from '#lib/utils/object-entries.js'

type HandleFormSubmitOptions = {
  store: Store
  currentTime: number
  formState: Record<StreamId, StreamState>
}

const handleFormSubmit = async (options: HandleFormSubmitOptions) => {
  const { store, currentTime, formState } = options

  for (const [streamId, state] of objectEntries(formState)) {
    if (!state) {
      return
    }

    const { description, labelList } = state

    const labelIdList = await Promise.all(
      labelList.map(async (label): Promise<LabelId> => {
        if ('id' in label) {
          return label.id
        }
        const labelId = genId<LabelId>()
        await store.mutate.label_create({
          labelId,
          streamId,
          name: label.name,
          color: undefined,
          icon: undefined,
          // NOTE: the parentId is updated afterwards to the correc
          // value
          parentId: undefined,
        })
        return labelId
      }),
    )

    const result = store.mutate.point_create({
      pointId: genId(),
      streamId,
      description,
      labelIdList,
      startedAt: currentTime,
    })
    if (result instanceof Error) {
      throw result
    }
  }

  await store.mutate.migrate_fixupLabelParents({
    startedAtGTE: currentTime,
  })

  goto('/log')
}

export { handleFormSubmit }

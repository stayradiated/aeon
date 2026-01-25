import type { StreamState } from '#lib/components/Add/StreamStatus.svelte'
import type { Store } from '#lib/core/replicache/store.js'
import type { StreamId } from '#lib/ids.js'

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

    const { description, labelIdList, createdLabelList } = state

    // create all labels necessary
    await Promise.all(
      createdLabelList.map(async (label): Promise<void> => {
        await store.mutate.label_create({
          labelId: label.id,
          streamId,
          name: label.name,
          color: undefined,
          icon: undefined,
          // NOTE: the parentId is updated afterwards to the correc
          // value
          parentId: undefined,
        })
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

  // TODO: what's the best way to handle this?
  await store.mutate.migrate_fixupLabelParents({
    startedAtGTE: currentTime,
  })

  goto('/log')
}

export { handleFormSubmit }

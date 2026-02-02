<script lang="ts">
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { StreamId } from '#lib/ids.js'
import type { Stream } from '#lib/types.local.js'

import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
  stream: Stream
}

const { store, stream }: Props = $props()

const { _: streamList } = $derived(watch(store.stream.asList))

const handleSetParentStream: ChangeEventHandler<HTMLSelectElement> = async (
  event,
) => {
  const value = event.currentTarget.value
  const parentId = value === '' ? undefined : (value as StreamId)
  await store.mutate.stream_setParent({
    streamId: stream.id,
    parentId,
  })
}

const handleMoveStreamUp = async () => {
  await store.mutate.stream_sort({
    streamId: stream.id,
    delta: -1,
  })
}

const handleMoveStreamDown = async () => {
  await store.mutate.stream_sort({
    streamId: stream.id,
    delta: 1,
  })
}

const handleRenameStream = async () => {
  const name = prompt('Stream Name', stream.name)
  if (!name || name === stream.name) {
    return
  }
  await store.mutate.stream_rename({
    streamId: stream.id,
    name,
  })
}

const handleDeleteStream = async () => {
  if (
    !confirm(`Are you sure you want to delete the "${stream.name}" stream?`)
  ) {
    return
  }
  await store.mutate.stream_delete({
    streamId: stream.id,
  })
}
</script>

<div class="StreamListItem">
  <select value={stream.parentId} onchange={handleSetParentStream}>
    <option value={undefined}></option>
    {#each streamList as streamItem (streamItem.id)}
      <option value={streamItem.id} disabled={streamItem.id === stream.id}>{streamItem.name}</option>
    {/each}
  </select>
  <span class="name">{stream.name}</span>
  <button onclick={handleMoveStreamUp}>⬆️</button>
  <button onclick={handleMoveStreamDown}>⬇️</button>
  <button onclick={handleRenameStream}>Rename</button>
  <button onclick={handleDeleteStream}>Delete</button>
</div>

<style>
  .StreamListItem {
    display: flex;
    align-items: center;
    gap: var(--size-2);
  }

  .name {
    flex: 1;
  }
</style>

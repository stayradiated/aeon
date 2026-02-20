<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Stream } from '#lib/types.local.js'

import { getDuplicateStreamList } from '#lib/core/select/get-duplicate-stream-list.js'

import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: duplicateStreamList } = $derived(
  watch(getDuplicateStreamList(store)),
)

const handleDeduplicate = async (streamList: Stream[]) => {
  if (streamList.length < 2) {
    return
  }

  const destinationStream = streamList[0]
  if (!destinationStream) {
    throw new Error('Missing destination stream')
  }
  const sourceStreamIdList = streamList.slice(1).map((stream) => stream.id)

  await store.mutate.stream_squash({
    destinationStreamId: destinationStream.id,
    sourceStreamIdList,
  })
}
</script>

{#if duplicateStreamList.length > 0}
  <section class="DuplicateStreamList">
    <h4>⚠️ Duplicate Streams</h4>


    <ul>
      {#each duplicateStreamList as streamList, index (index)}
        {@const firstStream = streamList[0]}
        {#if firstStream}
          <li>
            {streamList.length} x {firstStream.name}
            <button onclick={() => handleDeduplicate(streamList)}>Deduplicate</button>
          </li>
        {/if}
      {/each}
    </ul>
  </section>
{/if}

<style>
  .DuplicateStreamList {
    background: var(--color-grey-50);
    padding: var(--size-4);
    border-radius: var(--radius-sm);

    display: flex;
    flex-direction: column;
    gap: var(--size-2);
  }

  h4 {
    position: sticky;
    top: 0;
    background: var(--theme-background);
    padding: var(--size-2) var(--size-3);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-2);
  }
</style>

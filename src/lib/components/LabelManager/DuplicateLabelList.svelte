<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { StreamId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { getDuplicateLabelList } from '#lib/core/select/get-duplicate-label-list.js'

import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
  streamId: StreamId
}

const { store, streamId }: Props = $props()

const { _: duplicateLabelList } = $derived(
  watch(getDuplicateLabelList(store, streamId)),
)

const handleDeduplicate = async (labelList: Label[]) => {
  if (labelList.length < 2) {
    return
  }

  const destinationLabel = labelList[0]
  if (!destinationLabel) {
    throw new Error('Missing destination label')
  }
  const sourceLabelIdList = labelList.slice(1).map((label) => label.id)

  await store.mutate.label_squash({
    destinationLabelId: destinationLabel.id,
    sourceLabelIdList,
  })
}
</script>

{#if duplicateLabelList.length > 0}
  <section class="DuplicateLabelList">
    <h4>⚠️ Duplicate Labels</h4>


    <ul>
      {#each duplicateLabelList as labelList, index (index)}
        {@const firstLabel = labelList[0]}
        {#if firstLabel}
          <li>
            {labelList.length} x {firstLabel.name}
            <button onclick={() => handleDeduplicate(labelList)}>Deduplicate</button>
          </li>
        {/if}
      {/each}
    </ul>
  </section>
{/if}

<style>
  .DuplicateLabelList {
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

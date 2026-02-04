<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { StreamId } from '#lib/ids.js'

import { getLabelListGroupedByParent } from '#lib/core/select/get-label-list-grouped-by-parent.js'

import { watch } from '#lib/utils/watch.svelte.js'

import DuplicateLabelList from './DuplicateLabelList.svelte'
import LabelList from './LabelList.svelte'

type Props = {
  store: Store
  streamId: StreamId
}

const { store, streamId }: Props = $props()

const { _: stream } = $derived(watch(store.stream.get(streamId)))
const { _: groupedLabelList } = $derived(
  watch(getLabelListGroupedByParent(store, streamId)),
)
</script>

<div class="StreamLabelManager">
  {#if stream?.parentId}
    <nav>
      {#each groupedLabelList as [parentLabel] (parentLabel?.id)}
        {#if parentLabel}
          <a href="#label-{parentLabel.id}">{parentLabel.icon ? parentLabel.icon + ' ' : ''}{parentLabel.name}</a>
        {/if}
      {/each}
    </nav>
  {/if}

  <main>
    <h3>{stream?.name ?? '⚠️ Missing'}</h3>

    <DuplicateLabelList {store} {streamId} />

    {#each groupedLabelList as [parentLabel, labelList] (parentLabel?.id)}
      <LabelList {store} {parentLabel} {labelList} />
    {/each}
  </main>
</div>

<style>
  .StreamLabelManager {
    display: flex;
    padding: var(--size-4);
    gap: var(--size-4);
  }

  nav {
    max-width: 200px;
    display: flex;
    flex-direction: column;
    gap: var(--size-2);

    a {
      display: block;
      padding: var(--size-2) var(--size-3);
      border-radius: var(--radius-xs);
      background-color: var(--theme-background);
      color: var(--theme-text-main);
      text-decoration: none;

      &:hover {
        background-color: var(--theme-background-alt);
      }
    }
  }

  main {
    flex: 1;
  }
</style>

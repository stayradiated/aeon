<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { StreamId } from '#lib/ids.js'

import { getLabelListGroupedByParent } from '#lib/core/select/get-label-list-grouped-by-parent.js'

import { watch } from '#lib/utils/watch.svelte.js'

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

<h3>{stream?.name ?? '⚠️ Missing'}</h3>

<nav>
  {#each groupedLabelList as [parentLabel] (parentLabel?.id)}
    {#if parentLabel}
      <a href="#label-{parentLabel.id}">{parentLabel.icon ? parentLabel.icon + ' ' : ''}{parentLabel.name}</a>
    {/if}
  {/each}
</nav>

{#each groupedLabelList as [parentLabel, labelList] (parentLabel?.id)}
  <LabelList {store} {parentLabel} {labelList} />
{/each}

<style>
  nav {
    display: flex;
    flex-wrap: wrap;
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
</style>

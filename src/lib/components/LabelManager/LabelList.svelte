<script lang="ts">
import { SvelteSet } from 'svelte/reactivity'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import LabelListItem from './LabelListItem.svelte'

type Props = {
  store: Store
  parentLabel: Label | undefined
  labelList: Label[]
}

const { store, parentLabel, labelList }: Props = $props()

let selectedLabelIdSet = new SvelteSet<LabelId>([])
</script>

<section class="LabelList">
  {#if parentLabel}
    <h4 id="label-{parentLabel.id}">{parentLabel.icon ? parentLabel.icon + ' ' : ''}{parentLabel.name}</h4>
  {/if}

  {#each labelList as label (label.id)}
    <LabelListItem
      {store}
      {label}
      isSelected={selectedLabelIdSet.has(label.id)}
      onchange={(isSelected) => {
        if (isSelected) {
          selectedLabelIdSet.add(label.id)
        } else {
          selectedLabelIdSet.delete(label.id)
        }}}
    />
  {/each}
</section>

<style>
  .LabelList {
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
</style>

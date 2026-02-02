<script lang="ts">
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId, StreamId } from '#lib/ids.js'

import { getLabelListGroupedByParent } from '#lib/core/select/get-label-list-grouped-by-parent.js'

import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
  streamId: StreamId
  value: LabelId[]
  onchange?: (value: LabelId[]) => void
}

const { store, streamId, value, onchange }: Props = $props()

const { _: labelListGroupedByParent } = $derived(
  watch(getLabelListGroupedByParent(store, streamId)),
)

const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
  const selected = Array.from(event.currentTarget.selectedOptions).map(
    (option) => option.value as LabelId,
  )
  onchange?.(selected)
}
</script>

<select multiple {value} onchange={handleChange}>
  {#each labelListGroupedByParent as [parentLabel, labelList] (parentLabel?.id)}
    {#if parentLabel}
      <option disabled>{parentLabel.icon ? parentLabel.icon + ' ' : ''}{parentLabel.name}</option>
    {/if}
    {#each labelList as label (label.id)}
      <option value={label.id}>{label.name}</option>
    {/each}
  {/each}
</select>

<style>
  select {
    display: block;
    width: 100%;
  }
</style>

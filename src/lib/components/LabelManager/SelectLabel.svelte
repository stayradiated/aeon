<script lang="ts">
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId, StreamId } from '#lib/ids.js'

import { getLabelListGroupedByParent } from '#lib/core/select/label.js'

import { query } from '#lib/utils/query.js'

type Props = {
  store: Store
  streamId: StreamId
  value?: LabelId | undefined
  onchange?: (value: LabelId | undefined) => void
}

const { store, streamId, value, onchange }: Props = $props()

const { labelListGroupedByParent } = $derived(
  query({
    labelListGroupedByParent: getLabelListGroupedByParent(store, streamId),
  }),
)

const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
  const value = event.currentTarget.value
  onchange?.(value === '' ? undefined : (value as LabelId))
}
</script>

<select {value} onchange={handleChange}>
  <option value=''>[No Parent]</option>
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

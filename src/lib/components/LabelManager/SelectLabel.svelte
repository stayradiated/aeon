<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId, StreamId } from '#lib/ids.js'

import { getLabelList } from '#lib/core/select/get-label-list.js'

import { watch } from '#lib/utils/watch.svelte.js'

import MultiSelect from '#lib/components/MultiSelect/MultiSelect.svelte'

type Props = {
  id?: string
  store: Store
  streamId: StreamId
  value: LabelId[]
  onchange?: (value: LabelId[]) => void
}

const { id, store, streamId, value, onchange }: Props = $props()

const { _: labelList } = $derived(watch(getLabelList(store, streamId)))

const optionList = $derived(
  labelList.map((label) => ({
    value: label.id,
    label: label.name,
  })),
)

const selectedList = $derived(
  value.map((labelId) => ({
    value: labelId,
    label: labelList.find((label) => label.id === labelId)?.name ?? '',
  })),
)

const handleChange = (
  selectedList: Array<{ value: LabelId; label: string }>,
) => {
  onchange?.(selectedList.map(({ value }) => value))
}
</script>

<MultiSelect
  {id}
  {optionList}
  {selectedList}
  placeholder="Parent Labels"
  onchange={handleChange}
/>

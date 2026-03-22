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
    icon: label.icon,
    name: label.name,
  })),
)

const selectedList = $derived(
  value.map((labelId) => {
    const label = labelList.find((label) => label.id === labelId)
    return {
      value: labelId,
      icon: label?.icon,
      name: label?.name ?? '',
    }
  }),
)

const handleChange = (
  selectedList: Array<{ value: LabelId; name: string }>,
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

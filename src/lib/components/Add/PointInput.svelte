<script lang="ts">
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Label, Stream } from '#lib/types.local.js'

import { getFilteredLabelList } from '#lib/core/select/get-filtered-label-list.js'

import { genId } from '#lib/utils/gen-id.js'
import { query } from '#lib/utils/query.js'

import MultiSelect from '#lib/components/MultiSelect/MultiSelect.svelte'

type Props = {
  store: Store
  stream: Stream
  parentLabelIdList: readonly LabelId[]

  description: string
  labelIdList: readonly LabelId[]
  createdLabelList: readonly Pick<Label, 'id' | 'icon' | 'name'>[]

  onreset: () => void
  onchange: (value: {
    description?: string
    labelIdList?: readonly LabelId[]
    createdLabelList?: readonly Pick<Label, 'id' | 'icon' | 'name'>[]
  }) => void
}

let {
  store,
  stream,
  parentLabelIdList,
  description,
  labelIdList,
  createdLabelList,
  onchange,
  onreset,
}: Props = $props()

const uid = $props.id()

const { streamLabelList, outOfParentLabelList } = $derived(
  query(() => ({
    streamLabelList: getFilteredLabelList(store, stream.id, parentLabelIdList)
      .value,
    outOfParentLabelList: labelIdList.flatMap((labelId) => {
      const label = store.label.get(labelId).value
      if (!label) {
        return []
      }
      return parentLabelIdList.length === 0
        ? label.parentId === undefined
          ? []
          : label
        : label.parentId && parentLabelIdList.includes(label.parentId)
          ? []
          : label
    }),
  })),
)

type Option = {
  value: LabelId
  label: string
}

const optionList = $derived(
  [...outOfParentLabelList, ...streamLabelList, ...createdLabelList].map(
    (label): Option => ({
      value: label.id,
      label: (label.icon ? `${label.icon} ` : '') + label.name,
    }),
  ),
)

const handleReset = (event: MouseEvent) => {
  event.preventDefault()
  onreset()
}

const handleClearDescription = (event: MouseEvent) => {
  event.preventDefault()
  onchange({ description: '' })
}

const handleChangeDescription: ChangeEventHandler<HTMLTextAreaElement> = (
  event,
) => {
  onchange({ description: event.currentTarget.value })
}

const handleChangeLabel = (selected: LabelId[]) => {
  onchange({
    labelIdList: selected,
    createdLabelList: createdLabelList.filter((label) =>
      selected.includes(label.id),
    ),
  })
}

const handleCreateLabel = (name: string) => {
  const createdLabel = {
    id: genId<LabelId>(),
    name,
    icon: '',
  }
  onchange({
    labelIdList: [...labelIdList, createdLabel.id],
    createdLabelList: [...createdLabelList, createdLabel],
  })
}
</script>

<div class="container">
  <div class="row">
    <label for="{uid}-textarea">{stream.name}</label>
    <button class="reset-button" onclick={handleReset}> Reset </button>
  </div>

  <MultiSelect
    {optionList}
    selectedList={labelIdList}
    placeholder="Add label…"
    onchange={handleChangeLabel}
    oncreate={handleCreateLabel}
  />

  <div class="textarea-container">
    <textarea
      id="{uid}-textarea"
      rows="1"
      value={description}
      onchange={handleChangeDescription}
      placeholder="Add description…"></textarea>
    {#if description.length > 0}
      <button class="clear-value-button" onclick={handleClearDescription}>X</button>
    {/if}
  </div>
</div>

<style>
	.container {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding-bottom: 1rem;
	}

	.row {
		display: flex;
		justify-content: space-between;
	}

	label {
		font-weight: bold;
		line-height: 2rem;
		color: var(--theme-text-main);
	}

	.textarea-container {
		display: flex;
		gap: var(--size-2);
		padding-top: var(--size-2);
	}

	textarea {
		flex: 1;
		background: var(--theme-background);
		color: var(--theme-text-main);
		border: none;
		border-radius: var(--radius-xs);
		line-height: var(--line-xl);
		resize: none;
		padding: var(--size-1) var(--size-3);
	}
	textarea:focus {
		outline: var(--size-px) solid var(--theme-focus);
	}

	.clear-value-button {
		border: none;
		background: none;
		cursor: pointer;
		width: var(--size-10);
		font-weight: var(--weight-bold);
		background: var(--theme-background);
		border-radius: var(--radius-xs);
	}
	.clear-value-button:hover {
		background: var(--theme-background-alt);
	}

	.reset-button {
		border: none;
		background: none;
		text-transform: uppercase;
		font-size: var(--scale-000);
		cursor: pointer;
		color: var(--theme-text-muted);
		font-weight: var(--weight-bold);
	}
	.reset-button:hover {
		color: var(--theme-text-main);
	}
</style>

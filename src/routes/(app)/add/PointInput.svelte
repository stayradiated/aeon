<script lang="ts">
import { onMount } from 'svelte'
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Stream } from '#lib/types.local.js'

import { getLabelListByParent } from '#lib/core/select/label.js'

import { query } from '#lib/utils/query.js'

import MultiSelect from '#lib/components/MultiSelect/MultiSelect.svelte'

type Props = {
  store: Store
  stream: Stream
  parentLabelIdList: readonly LabelId[]

  labelList: readonly ({ id: LabelId } | { name: string })[]
  description: string

  onreset: () => void
  onchange: (value: {
    description?: string
    labelList?: readonly ({ id: LabelId } | { name: string })[]
  }) => void
}

let {
  store,
  stream,
  parentLabelIdList,
  labelList,
  description,
  onchange,
  onreset,
}: Props = $props()

const uid = $props.id()

// hack to focus the input on mount
// TODO: rewrite MultiSelect to support this use case
let selectInputEl = $state<HTMLInputElement | null>(null)
onMount(() => {
  setTimeout(() => {
    selectInputEl?.focus()
  }, 10)
})

const { streamLabelList } = $derived(
  query({
    streamLabelList: getLabelListByParent(store, stream.id, parentLabelIdList),
  }),
)

type Option = {
  value?: LabelId
  label: string
}

const optionList = $derived(
  streamLabelList.map(
    (label): Option => ({
      value: label.id,
      label: (label.icon ? `${label.icon} ` : '') + label.name,
    }),
  ),
)

const selectedOptionList = $derived(
  labelList.flatMap((labelOrCreate): Option | never[] => {
    if ('id' in labelOrCreate) {
      const labelId = labelOrCreate.id
      return (
        optionList.find((option) => {
          return option.value === labelId
        }) ?? []
      )
    }
    return {
      label: labelOrCreate.name,
    }
  }),
)

let optionCreate = $state.raw<Option>()

const visibleOptionList = $derived.by((): Option[] => {
  if (optionCreate) {
    return [...optionList, optionCreate]
  }
  return optionList
})

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

const handleChangeLabel = (data: {
  option?: Option
  options?: Option[]
  type: 'add' | 'remove' | 'removeAll' | 'selectAll' | 'reorder'
}) => {
  switch (data.type) {
    case 'add': {
      if (typeof data.option === 'string') {
        const label = data.option
        onchange({ labelList: [...labelList, { name: label }] })
      } else if (typeof data.option?.value === 'string') {
        const labelId = data.option.value
        onchange({ labelList: [...labelList, { id: labelId }] })
      }
      break
    }
    case 'remove': {
      const labelId = data.option?.value
      if (labelId) {
        onchange({
          labelList: labelList.filter(
            (item) => 'id' in item && item.id !== labelId,
          ),
        })
      } else {
        const name = data.option?.label
        if (name) {
          onchange({
            labelList: labelList.filter(
              (item) => 'name' in item && item.name !== name,
            ),
          })
        }
      }
      break
    }
    case 'removeAll': {
      onchange({ labelList: [] })
      break
    }
    default:
      break
  }
}
</script>

<div class="container">
  <div class="row">
    <label for="{uid}-textarea">{stream.name}</label>
    <button class="reset-button" onclick={handleReset}> Reset </button>
  </div>

  <MultiSelect
    bind:input={selectInputEl}
    key={(option) => option.value}
    selected={selectedOptionList}
    options={visibleOptionList}
    allowUserOptions="append"
    placeholder="Add label…"
    onchange={handleChangeLabel}
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

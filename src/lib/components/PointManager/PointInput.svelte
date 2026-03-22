<script lang="ts">
import { computed } from 'signia'
import { tick } from 'svelte'
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Label, Stream } from '#lib/types.local.js'

import { getActivePoint } from '#lib/core/select/get-active-point.js'
import { getFilteredLabelList } from '#lib/core/select/get-filtered-label-list.js'
import { getLabelCountRecord } from '#lib/core/select/get-label-count-record.js'

import { clockMin } from '#lib/utils/clock.js'
import { subDays } from '#lib/utils/days.js'
import { genId } from '#lib/utils/gen-id.js'
import { watch } from '#lib/utils/watch.svelte.js'

import MultiSelect from '#lib/components/MultiSelect/MultiSelect.svelte'

export type PointInputValue = {
  description?: string
  labelIdList?: readonly LabelId[]
  createdLabelList?: readonly Pick<Label, 'id' | 'icon' | 'name'>[]
}

type Props = {
  store: Store
  stream: Stream
  parentLabelIdList?: readonly LabelId[]
  currentTime: number

  autofocus?: boolean

  description: string
  labelIdList: readonly LabelId[]
  createdLabelList: readonly Pick<Label, 'id' | 'icon' | 'name'>[]

  onreset: () => void
  onchange: (value: PointInputValue) => void
}

let {
  store,
  stream,
  currentTime,
  parentLabelIdList: maybeParentLabelIdList,
  autofocus,
  description,
  labelIdList,
  createdLabelList,
  onchange,
  onreset,
}: Props = $props()

let showDescription = $derived(description.length > 0)
let descriptionEl = $state<HTMLTextAreaElement>()

const { _: now } = watch(clockMin)

const { _: currentParentPoint } = $derived(
  stream.parentId
    ? watch(getActivePoint(store, stream.parentId, currentTime))
    : watch.undefined,
)

const parentLabelIdList = $derived(
  maybeParentLabelIdList ?? currentParentPoint?.labelIdList ?? [],
)

const uid = $props.id()

const { _: streamLabelList } = $derived(
  watch(getFilteredLabelList(store, stream.id, parentLabelIdList)),
)

// count label usage over the last 7 days
const { _: labelPopularity } = $derived(
  watch(
    getLabelCountRecord(store, stream.id, {
      startedAt: { gte: subDays(now, 7), lte: now },
    }),
  ),
)

type Option = {
  value: LabelId
  icon: string | undefined
  name: string
}

const toOption = (label: Pick<Label, 'id' | 'icon' | 'name'>): Option => ({
  value: label.id,
  icon: label.icon,
  name: label.name,
})

const optionList = $derived(
  [
    ...streamLabelList.toSorted((a, b) => {
      // sort by usage
      const popularityA = labelPopularity[a.id] ?? 0
      const popularityB = labelPopularity[b.id] ?? 0
      return popularityB - popularityA
    }),
    ...createdLabelList,
  ].map((label) => toOption(label)),
)

// resolve each label in the labelIdList to a label object
const { _: selectedList } = $derived(
  watch(
    computed('selectedList', (): Option[] => {
      return labelIdList.flatMap((labelId) => {
        // check if the label is in the createdLabelList
        const createdLabel = createdLabelList.find(
          (createdLabel) => createdLabel.id === labelId,
        )
        if (createdLabel) {
          return toOption(createdLabel)
        }

        const label = store.label.get(labelId).value
        if (!label) {
          // (skip any that can't be resolved)
          return []
        }

        // transform to `Option` type
        return toOption(label)
      })
    }),
  ),
)

const handleReset = (event: MouseEvent) => {
  event.preventDefault()
  onreset()
}

const handleToggleDescription = async () => {
  if (showDescription) {
    onchange({ description: '' })
  } else {
    showDescription = true
    await tick()
    descriptionEl?.focus()
  }
}

const handleChangeDescription: ChangeEventHandler<HTMLTextAreaElement> = (
  event,
) => {
  onchange({ description: event.currentTarget.value })
}

const handleChangeLabel = (selected: Option[]) => {
  const labelIdList = selected.map((option) => option.value)

  onchange({
    labelIdList,

    // Update the `createdLabelList` state to only include labels that are
    // selected
    // i.e. previously created labels thate are no longer selected are removed
    // from the create list.
    createdLabelList: createdLabelList.filter((label) =>
      labelIdList.includes(label.id),
    ),
  })
}

const handleCreateLabel = (name: string) => {
  const createdLabel = {
    id: genId<LabelId>(),
    name,
    icon: undefined,
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

  {#if showDescription}
    <div class="textarea-container">
      <textarea
        id="{uid}-textarea"
        bind:this={descriptionEl}
        rows="1"
        value={description}
        onchange={handleChangeDescription}
        placeholder="Add description…"></textarea>
      <button class="toggle-description-button" onclick={handleToggleDescription}>🗑</button>
    </div>
  {/if}

  <MultiSelect
    isCreatable
    {autofocus}
    {optionList}
    {selectedList}
    placeholder="Add label…"
    onchange={handleChangeLabel}
    oncreate={handleCreateLabel}>
    {#if !showDescription}
      <button class="toggle-description-button" onclick={handleToggleDescription}>🗒</button>
    {/if}
  </MultiSelect>
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
    padding-bottom: var(--size-2);
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

  .toggle-description-button {
    width: var(--size-8);
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

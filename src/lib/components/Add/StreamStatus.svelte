<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Label, Stream } from '#lib/types.local.js'

import { getActivePoint } from '#lib/core/select/get-active-point.js'

import { formatDurationRough } from '#lib/utils/format-duration.js'
import { query } from '#lib/utils/query.js'

import PointInput from './PointInput.svelte'

export type StreamState = {
  description: string
  labelIdList: readonly LabelId[]
  createdLabelList: readonly Pick<Label, 'id' | 'icon' | 'name'>[]
}

type Props = {
  store: Store
  stream: Stream
  currentTime: number
  state: StreamState | undefined
  parentState: StreamState | undefined
  onchange: (state: StreamState | undefined) => void
}

const { store, stream, parentState, currentTime, state, onchange }: Props =
  $props()

const { currentPoint, currentParentPoint, labelList } = $derived(
  query(() => {
    const currentPoint = getActivePoint(store, stream.id, currentTime).value
    const currentParentPoint = stream.parentId
      ? getActivePoint(store, stream.parentId, currentTime).value
      : undefined
    const labelList = (currentPoint?.labelIdList ?? []).flatMap((labelId) => {
      return store.label.get(labelId).value ?? []
    })
    return { currentPoint, currentParentPoint, labelList }
  }),
)

const handleEdit = (event: MouseEvent) => {
  event.preventDefault()
  onchange({
    description: currentPoint?.description ?? '',
    labelIdList: currentPoint?.labelIdList ?? [],
    createdLabelList: [],
  })
}
</script>

{#if state}
  <PointInput
    {store}
    {stream}
    parentLabelIdList={parentState?.labelIdList ?? currentParentPoint?.labelIdList ?? []}
    description={state.description}
    labelIdList={state.labelIdList}
    createdLabelList={state.createdLabelList}
    onchange={(value) => onchange({
      description: value.description ?? state.description,
      labelIdList: value.labelIdList ?? state.labelIdList,
      createdLabelList: value.createdLabelList ?? state.createdLabelList,
    })}
    onreset={() => { onchange(undefined) }}
  />
{:else}
  <button class="container" onclick={handleEdit}>
    <div class="label">{stream.name}</div>
    <div class="value">
      {#if labelList.length === 0}
        --
      {:else}
        {#each labelList as label (label.id)}
          {label.icon ?? ''} {label.name}
        {/each}
      {/if}
    </div>
    <div class="duration">
      {currentPoint ? formatDurationRough(currentTime - currentPoint?.startedAt) : ''}
    </div>
  </button>
{/if}

<style>
	.container {
		padding: 0 var(--size-3);
		background: var(--theme-background);
		border: none;
		color: var(--theme-text-main);
		border-radius: var(--radius-xs);
		cursor: pointer;

		display: grid;
		grid-template-areas:
			'label value'
			'label duration';

		justify-content: space-between;
		line-height: var(--line-xl);
		border-bottom: 1px solid var(--theme-border);
	}
	.container:hover {
		background-color: var(--theme-background-alt);
	}

	.label {
		font-weight: var(--weight-bold);
		grid-area: label;
		font-size: var(--scale-1);
	}

	.value {
		grid-area: value;
		text-align: right;
		font-size: var(--scale-1);
	}

	.duration {
		grid-area: duration;
		text-align: right;
		font-size: var(--scale-0);
		color: var(--theme-text-muted);
	}
</style>

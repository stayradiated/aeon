<script lang="ts">
import { computed } from 'signia'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Label, Stream } from '#lib/types.local.js'

import { getActivePoint } from '#lib/core/select/get-active-point.js'

import { formatDurationRough } from '#lib/utils/format-duration.js'
import { watch } from '#lib/utils/watch.svelte.js'

export type StreamState =
  | {
      type: 'edit'
      description: string
      labelIdList: readonly LabelId[]
      createdLabelList: readonly Pick<Label, 'id' | 'icon' | 'name'>[]
    }
  | {
      type: 'delete'
    }

type Props = {
  store: Store
  stream: Stream
  currentTime: number
  state: StreamState | undefined
  onchange: (state: StreamState | undefined) => void
}

const { store, stream, currentTime, state, onchange }: Props = $props()

const { _: currentPoint } = $derived(
  watch(getActivePoint(store, stream.id, currentTime)),
)

const { _: labelList } = $derived(
  watch(
    computed('labelList', () =>
      (currentPoint?.labelIdList ?? []).flatMap((labelId) => {
        return store.label.get(labelId).value ?? []
      }),
    ),
  ),
)

const isStartedAtCurrentTime = $derived(currentPoint?.startedAt === currentTime)
const isDeleted = $derived(state?.type === 'delete')

const handleEdit = (event: MouseEvent) => {
  event.preventDefault()
  onchange({
    type: 'edit',
    description: currentPoint?.description ?? '',
    labelIdList: currentPoint?.labelIdList ?? [],
    createdLabelList: [],
  })
}

const handleRestore = () => {
  onchange(undefined)
}

const handleDelete = () => {
  onchange({
    type: 'delete',
  })
}
</script>

<div class="StreamStatus">
  <button class="container" class:isHighlighted={isStartedAtCurrentTime} class:isDeleted onclick={handleEdit}>
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
  {#if isStartedAtCurrentTime}
    {#if isDeleted}
      <button onclick={handleRestore}>Restore</button>
    {:else}
      <button onclick={handleDelete}>Delete</button>
    {/if}
  {/if}
</div>

<style>
  .StreamStatus {
    display: flex;
    gap: var(--size-2);
  }

  .container {
    flex: 1;

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

    &:hover {
      background-color: var(--theme-background-alt);
    }
    &.isHighlighted {
      border-right: var(--size-2) solid var(--color-yellow-500);
    }
    &.isDeleted {
      opacity: 0.5;
      text-decoration: line-through;
    }
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

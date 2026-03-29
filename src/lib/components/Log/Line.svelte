<script lang="ts">
import { computed } from 'signia'

import type { Store } from '#lib/core/replicache/store.js'
import type { Line } from '#lib/core/shape/types.js'

import { calcDuration } from '#lib/core/shape/calc-duration.js'

import { clockMin } from '#lib/utils/clock.js'
import { formatDuration } from '#lib/utils/format-duration.js'
import { watch } from '#lib/utils/watch.svelte.js'

import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  store: Store
  line: Line
  isCarryOver: boolean
  isStart: boolean
  isEnd: boolean
}

const { store, line, isCarryOver, isStart, isEnd }: Props = $props()

const { _: labelList } = $derived(
  watch(
    computed('labelList', () => {
      const labelList = line.labelIdList.flatMap((labelId) => {
        return store.label.get(labelId).value ?? []
      })
      return labelList
    }),
  ),
)

const { _: now } = $derived(watch(clockMin))
const durationMs = $derived(calcDuration(line, now))

const firstLabel = $derived(labelList.at(0))
const showDetails = $derived(isStart || isCarryOver)
</script>

<div class="Line" class:isCarryOver class:isEnd style:--color={firstLabel?.color}>
  {#if showDetails}
    {#if labelList.length > 0}
      {#each labelList as label (label.id)}
        <a class="label" href="/label/{label.id}">
          {#if label.icon}
            <Emoji native={label.icon} scale="00" />
          {/if}<span class="name">{label.name}</span>
        </a>
      {/each}
    {/if}

    {#if line.description}
      <span class="description">{line.description}</span>
    {/if}

    <span class="duration">{formatDuration(durationMs)}</span>
  {/if}
</div>

<style>
  .Line {
    height: 100%;
    display: flex;
    flex-direction: column;

    --color: #eee;
    background-color: color-mix(in srgb, var(--color) 5%, transparent);
    color: #000;
    box-shadow: inset 6px 0 var(--color);

    gap: var(--size-1);

    &.isEnd {
      border-bottom: 2px solid #fff;
    }
  }

  .isCarryOver .label {
    background-color: color-mix(in srgb, var(--color) 25%, transparent);
    color: rgba(0, 0, 0, 0.8);
    font-weight: var(--weight-regular);
  }

  .label {
    /* use z-index hack to render text above the neighbours border */
    position: relative;
    z-index: var(--layer-1);
    background-color: var(--color);

    padding-block: var(--size-1);
    padding-left: var(--size-2);

    display: flex;
    flex-wrap: wrap;
    gap: var(--size-1);
    line-height: var(--line-md);
    align-items: center;

    text-decoration: none;
    color: contrast-color(var(--color));
    font-weight: 600;
    font-size: var(--scale-00);

    &:hover {
      text-decoration: underline;
    }
  }

  .description {
    font-style: italic;
    padding-left: var(--size-2);
  }

  .duration {
    font-family: var(--font-mono);
    font-size: var(--scale-000);
    padding-left: var(--size-2);
    line-height: var(--line-md);
  }
</style>

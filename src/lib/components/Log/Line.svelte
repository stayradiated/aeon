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
  isHeading: boolean
  isEnd: boolean
}

const { store, line, isHeading, isEnd }: Props = $props()

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
</script>

<div class="Line" class:isEnd style:--color={firstLabel?.color}>
  {#if isHeading}
    {#if labelList.length > 0}
      {#each labelList as label (label.id)}
        <a class="label" href="/label/{label.id}">
          {#if label.icon}
            <Emoji native={label.icon} />&nbsp;
          {/if}{label.name}
        </a>
      {/each}
    {/if}

    {#if line.description}
      <em>{line.description}</em>
    {/if}

    <code>{formatDuration(durationMs)}</code>
  {/if}
</div>

<style>
  .Line {
    height: 100%;
    display: flex;
    flex-direction: column;

    --color: #ccc;
    background-color: color-mix(in srgb, var(--color) 5%, transparent);
    color: #000;
    padding-top: var(--size-1);
    padding-left: var(--size-3);
    box-shadow: inset 6px 0 var(--color);

    gap: var(--size-1);

    &.isEnd {
      border-bottom: 2px solid #fff;
    }
  }

  .label {
    /* use z-index hack to render text above the neighbours border */
    position: relative;
    z-index: var(--layer-1);

    text-decoration: none;
    color: inherit;
    font-weight: 600;
    font-size: var(--scale-00);

    &:hover {
      text-decoration: underline;
    }
  }

  code {
    font-size: var(--scale-000);
  }
</style>

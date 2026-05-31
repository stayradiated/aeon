<script lang="ts">
import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext'
import { computed } from 'signia'

import type { Store } from '#lib/core/replicache/store.js'
import type { Line } from '#lib/core/shape/types.js'

import { calcDuration } from '#lib/core/shape/calc-duration.js'

import { clockMin } from '#lib/utils/clock.js'
import { formatDuration } from '#lib/utils/format-duration.js'
import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
  line: Line
  isStart: boolean
  isEnd: boolean
}

const { store, line, isStart, isEnd }: Props = $props()

let elWidth = $state<number>(0)

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

const labelLines = $derived.by(() => {
  const lineWidth = Math.max(100, elWidth)
  const lineHeight = 21

  return labelList.map((label) => {
    const text = label.name
    const preparedText = prepareWithSegments(text, 'bold 14px Cambay')
    const result = layoutWithLines(preparedText, lineWidth, lineHeight)
    return result.lines
  })
})

const { _: now } = $derived(watch(clockMin))
const durationMs = $derived(calcDuration(line, now))

const firstLabel = $derived(labelList.at(0))
const showDetails = $derived(isEnd)
</script>

<div class="Line" bind:clientWidth={elWidth} class:isStart style:--color={firstLabel?.color}>
  {#if showDetails}

    {#if labelList.length > 0}
      <div class="labelList">
        {#each labelList as label, index (label.id)}
          {@const lines = labelLines[index] ?? []}
          <a class="label" href="/label/{label.id}" style:--color={label.color}>
            {#each lines as line, lineIndex (lineIndex)}
              <div class="line" style:--width={line.width}>{#if lineIndex === 0 && typeof label.icon === 'string'}<span class="icon">{label.icon}</span>{/if}{line.text}</div>
            {/each}
          </a>
        {/each}
      </div>
    {/if}

    <span class="duration">{formatDuration(durationMs)}</span>

    {#if line.description}
      <span class="description">{line.description}</span>
    {/if}
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

    /* gap: var(--size-1); */

    &.isStart {
      border-bottom: 2px solid #fff;
    }
  }

  .labelList {
    display: flex;
    flex-direction: column;
    gap: var(--size-1);

    position: sticky;
    top: 0;
  }

  .label {
    /* use z-index hack to render text above the neighbours border */
    position: relative;
    z-index: var(--layer-1);
    background-color: var(--color);

    color: contrast-color(var(--color));
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }

    .line {
      height: 16px;
      line-height: 1;
      display: flex;
      align-items: center;
      box-sizing: content-box;
      padding-inline: var(--size-2);
      padding-top: 5px;
      background-color: var(--color);
      color: inherit;
      font-size: 14px;
      font-weight: 600;
      width: calc(var(--width) * 1px);

      &:has(.icon) {
        width: calc((var(--width) * 1px) + 24px);
      }

      .icon {
        display: block;
        width: 20px;
        flex-shrink: 0;
      }
    }
  }

  .description {
    /* use z-index hack to render text above the neighbours border */
    position: relative;
    z-index: var(--layer-1);

    font-style: italic;
    padding-left: var(--size-3);
    font-size: var(--scale-00);
  }

  .duration {
    /* use z-index hack to render text above the neighbours border */
    position: relative;
    z-index: var(--layer-1);

    font-family: var(--font-mono);
    font-size: var(--scale-000);
    padding-left: var(--size-2);
    line-height: var(--line-md);
  }
</style>

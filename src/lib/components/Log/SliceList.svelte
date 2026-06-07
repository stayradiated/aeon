<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'

import { getSliceGrid } from '#lib/core/select/get-slice-grid.js'
import { getVisibleStreamList } from '#lib/core/select/get-visible-stream-list.js'
import { calcDuration } from '#lib/core/shape/calc-duration.js'

import { clockMin } from '#lib/utils/clock.js'
import { watch } from '#lib/utils/watch.svelte.js'

import { getLineHeight } from './get-line-height.js'
import Line from './Line.svelte'

type Props = {
  store: Store
  timeZone: string
  startedAt: number
  stoppedAt: number
}

const { store, timeZone, startedAt, stoppedAt }: Props = $props()

const { _: sliceGrid } = $derived(
  watch(
    getSliceGrid(store, {
      startedAt: { gte: startedAt, lte: stoppedAt },
    }),
  ),
)
const { _: now } = watch(clockMin)
const { _: streamList } = $derived(watch(getVisibleStreamList(store)))

const formatTime = (instant: number): string => {
  return dateFns.format(instant, 'HH:mm', { in: tz(timeZone) })
}

const reversedRowList = $derived(sliceGrid.rowList.toReversed())
</script>

<div class="SliceList" style:--stream-count={streamList.length}>
  <header>
    <h5>time</h5>
    {#each streamList as stream (stream.id)}
      <h5>{stream.name}</h5>
    {/each}
  </header>

  {#each reversedRowList as row, rowIndex (rowIndex)}
    {@const prevRow = reversedRowList[rowIndex - 1]}
    <section style:--height={getLineHeight(calcDuration(row, now))}>
      <div class="cell time" style:--row={rowIndex + 2} style:--col="1"><a href="/edit/slice/{row.startedAt}">{formatTime(row.startedAt)}</a></div>

      {#each streamList as stream, columnIndex (stream.id)}
        {@const line = row.cellList.find((line) => line?.streamId === stream.id)}
        {#if line}
          {@const isEnd = line.stoppedAt === prevRow?.startedAt}
          {@const isStart = line.startedAt === row.startedAt}
          <div class="cell" style:--row={rowIndex + 2} style:--col={columnIndex + 2}>
            <Line
              {store}
              {line}
              {isStart}
              {isEnd}
            />
          </div>
        {/if}
      {/each}
    </section>
  {/each}
</div>

<style>
  .SliceList {
    display: grid;
    grid-template-columns: var(--size-10) repeat(var(--stream-count), minmax(0, 1fr));
  }

  header, section {
    display: contents;
  }

  section:hover .cell {
    background: rgba(0, 0, 0, 5%);
  }

  h5 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    font-size: var(--scale-000);
    margin-block: var(--size-2);
  }

  .cell {
    grid-column: var(--col);
    grid-row: var(--row);
    white-space: pre-wrap;
    min-height: calc(var(--height) * 1px);

    &.time {
      font-size: var(--scale-000);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: end;
      padding: var(--size-2);
    }
  }

  a {
    text-decoration: none;
    font-family: var(--font-mono);
  }
</style>

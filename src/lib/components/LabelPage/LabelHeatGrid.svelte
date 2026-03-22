<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'

import { getDailyDurationList } from '#lib/core/select/get-daily-duration-list.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { buildGrid, getCoords } from '#lib/utils/calendar-grid.js'
import { clockMin } from '#lib/utils/clock.js'
import { watch } from '#lib/utils/watch.svelte.js'

import HeatGrid from '#lib/components/HeatGrid/HeatGrid.svelte'

type Props = {
  store: Store
  labelId: LabelId
  year: number
}

const { store, labelId, year }: Props = $props()

const { _: now } = $derived(watch(clockMin))
const { _: label } = $derived(watch(store.label.get(labelId)))

const rangeStart = $derived(calDateFns.fromUTC(year, 0, 1))
const rangeEnd = $derived(calDateFns.fromUTC(year, 11, 31))

const { _: dailyDurationList } = $derived(
  label
    ? watch(
        getDailyDurationList(
          store,
          label.streamId,
          {
            startedAt: {
              gte: calDateFns.toEarliestInstant(rangeStart),
              lte: calDateFns.toLatestInstant(rangeEnd),
            },
            labelId,
          },
          now,
        ),
      )
    : watch.lit([]),
)

const grid = $derived.by(() => {
  const grid = buildGrid({
    startDate: rangeStart,
    endDate: rangeEnd,
    width: 7,
  })

  for (const entry of dailyDurationList) {
    const { rowIndex, cellIndex } = getCoords(grid, entry.date)
    const row = grid.rows[rowIndex]
    if (!row) {
      continue
    }

    const cell = row.cells[cellIndex]
    if (!cell) {
      continue
    }

    cell.durationMs = entry.durationMs
  }

  return grid
})
</script>

<div class="LabelHeatGrid">
  <h4>{year}</h4>
  <HeatGrid {grid} />
</div>

<style>
  .LabelHeatGrid {
    position: relative;
  }

  h4 {
    margin: 0;
    transform: rotate(-90deg);
    position: absolute;
    left: calc(var(--size-8) * -1);
    top: var(--size-4);
  }
</style>

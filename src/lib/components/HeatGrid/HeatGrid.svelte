<script lang="ts">
import type { Grid } from '#lib/utils/calendar-grid.js'

import { getHeatmapColor } from './get-heatmap-color.js'

type Props = {
  grid: Grid
}

const { grid }: Props = $props()
</script>

<div class="HeatGrid" style:--height={grid.width} style:--width={grid.rows.length}>
  {#each grid.rows as row, rowIndex (rowIndex)}
    {#each row.cells as cell, cellIndex (cellIndex)}
      <div class="cell" style:--color={getHeatmapColor((cell?.durationMs ?? 0) / 1000 / 60)}></div>
    {/each}
  {/each}
</div>

<style>
  .HeatGrid {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: repeat(var(--width), 1fr);
    grid-template-rows: repeat(var(--height), var(--size-3));
    gap: var(--size-px);
    background: var(--color-grey-100);
    padding: var(--size-px);
  }

  .cell {
    background: var(--color);
  }
</style>

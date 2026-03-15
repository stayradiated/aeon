<script lang="ts">
import type { Grid } from '#lib/utils/calendar-grid.js'

import { getHeatmapColor } from './get-heatmap-color.js'

type Props = {
  grid: Grid
}

const { grid }: Props = $props()
</script>

<div
  class="HeatGrid"
  style:--rows={grid.width}
  style:--cols={grid.rows.length}>
  <div class="grid">
    {#each grid.rows as row, rowIndex (rowIndex)}
      {#each row.cells as cell, cellIndex (cellIndex)}
        <div
          class="cell"
          class:placeholder={typeof cell === 'undefined'}
          style:--color={getHeatmapColor((cell?.durationMs ?? 0) / 1000 / 60)}></div>
      {/each}
    {/each}
  </div>
</div>

<style>
  .HeatGrid {
    container-type: inline-size;
  }

  .grid {
    --gap: var(--size-px);
    --cell-size: calc((100cqw - (var(--cols) - 1) * var(--gap) - 2 * var(--gap)) / var(--cols));

    display: grid;
    grid-auto-flow: column;
    grid-template-columns: repeat(var(--cols), var(--cell-size));
    grid-template-rows: repeat(var(--rows), var(--cell-size));

    /* draw grid border by adding padding and setting a background colour */
    gap: var(--gap);
    padding: var(--gap);
    background: var(--color-grey-100);
  }

  .cell {
    background: var(--color);
  }

  .cell.placeholder {
    background:
      repeating-linear-gradient(
        135deg,
        var(--color-grey-50) 0 2px,
        var(--color-grey-400) 2px 4px
      );
  }
</style>

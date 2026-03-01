<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Row } from '#lib/utils/calendar-grid.js'

import CalendarCell from './CalendarCell.svelte'

type Props = {
  store: Store
  row: Row
}

const { store, row }: Props = $props()
</script>

<div class="CalendarRow">
  {#each row.cells as cell, index (index)}
    {#if typeof cell === 'undefined'}
      <div></div>
    {:else}
      <CalendarCell {store} {cell} />
    {/if}
  {/each}
</div>

<style>
  .CalendarRow {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
  }
</style>

<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Cell, Track } from '#lib/utils/calendar-grid.js'

import Span from './Span.svelte'

type Props = {
  store: Store
  cell: Cell
  track: Track
}

const { store, cell, track }: Props = $props()
</script>

{#each track.spans as span, index (index)}
  <Span {store} {cell} {span} />
{/each}

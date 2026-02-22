<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'

import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: status } = $derived(watch(store.status.get(store.sessionUserId)))
</script>

{#if status}
  <div>
    <span>{status.emoji}</span>
    <span>{status.status}</span>
  </div>
{/if}

<style>
div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
span {
  font-size: 0.8rem;
}
</style>

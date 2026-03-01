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
  <div class="Status">
    <span>{status.emoji}</span>
    <span>{status.status}</span>
  </div>
{/if}

<style>
.Status {
  display: flex;
  align-items: center;
  gap: var(--size-2);
  padding: var(--size-3);
  background-color: var(--color-grey-100);
}

span {
  font-size: 0.8rem;
}
</style>

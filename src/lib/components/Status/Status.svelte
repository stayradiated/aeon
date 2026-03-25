<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'

import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: status } = $derived(watch(store.status.get(store.sessionUserId)))

let showMessageLog = $state(false)

const handleToggleMessageLog = () => {
  showMessageLog = !showMessageLog
}
</script>

{#if status}
  <button onclick={handleToggleMessageLog} class="Status">
    <span>{status.emoji}</span>
    <span>{status.status}</span>
  </button>

  {#if showMessageLog}
    <pre class="messageLog"><code>{JSON.stringify(status.messageLog, null, 2)}</code></pre>
  {/if}
{/if}

<style>
.Status {
  display: flex;
  align-items: center;
  gap: var(--size-2);
  padding: var(--size-3);
  background-color: var(--color-grey-100);
  border: none;

  span {
    font-size: var(--scale-000);
    line-height: var(--line-md);
    text-align: left;
  }
}

.messageLog {
  margin: 0;
  white-space: pre-wrap;
  font-size: var(--scale-000);
  line-height: var(--line-md);
  text-align: left;
  padding: var(--size-3);
  background: var(--color-grey-50);
  color: var(--color-blue-700);
}
</style>

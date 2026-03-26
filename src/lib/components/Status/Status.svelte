<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'

import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: status } = $derived(watch(store.status.get(store.sessionUserId)))
const systemPrompt = $derived(
  status?.messageLog &&
    typeof status?.messageLog === 'object' &&
    'system' in status.messageLog &&
    typeof status.messageLog.system === 'string'
    ? status.messageLog.system
    : undefined,
)
const userPrompt = $derived(
  status?.messageLog &&
    typeof status?.messageLog === 'object' &&
    'prompt' in status.messageLog &&
    typeof status.messageLog.prompt === 'string'
    ? status.messageLog.prompt
    : undefined,
)

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
    <div class="messageLog">
      <h4>System</h4>
      <pre><code>{systemPrompt}</code></pre>
      <h4>User</h4>
      <pre><code>{userPrompt}</code></pre>
    </div>
  {/if}
{/if}

<style>
.Status {
  width: 100%;
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
  white-space: pre-wrap;
  font-size: var(--scale-000);
  line-height: var(--line-md);
  text-align: left;
  padding: var(--size-3);
  background: var(--color-grey-50);

  h4 {
    margin: 0;
  }
  pre {
    margin: 0;
  }
}
</style>

<script lang="ts">
import { onMount } from 'svelte'

import { registerServiceWorker } from '../../service-worker.init.js'

let showUpdate = $state(false)
let applyUpdate = $state<() => void>()

onMount(async () => {
  await registerServiceWorker((update) => {
    showUpdate = true
    applyUpdate = update
  })
})
</script>

{#if showUpdate}
  <div class="update-banner">
    <span>A new version of Aeon is available.</span>
    <div>
      <button onclick={() => { showUpdate = false }}>Ignore</button>
      <button onclick={() => applyUpdate?.()}>Update</button>
    </div>
  </div>
{/if}

<style>
  .update-banner {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: var(--size-2);
    padding: var(--size-3);
    background: var(--color-blue-700);
    color: var(--color-grey-50);
    z-index: var(--layer-top);
  }
</style>

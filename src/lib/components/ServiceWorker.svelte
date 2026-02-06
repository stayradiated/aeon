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

function handleUpgrade() {
  applyUpdate?.()
}
</script>

{#if showUpdate}
  <div class="update-banner">
    <span>A new version is available.</span>
    <button onclick={handleUpgrade}>Update</button>
  </div>
{/if}

<style>
  .update-banner {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: #111;
    color: white;
    z-index: 9999;
  }
</style>

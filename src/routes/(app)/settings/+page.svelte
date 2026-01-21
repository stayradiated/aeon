<script lang="ts">
import { dropAllDatabases } from 'replicache'

import type { PageProps } from './$types'

import StreamManager from '#lib/components/StreamManager/StreamManager.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

import { openFilePicker } from '#lib/utils/open-file-picker.js'

const handleResetReplicache = async () => {
  await dropAllDatabases()
  window.location.reload()
}

const handleImport = async () => {
  const fileList = await openFilePicker({
    accept: 'application/json',
  })
  const file = fileList[0]
  if (!file) {
    return
  }

  const response = await fetch('/api/internal/import', {
    method: 'POST',
    body: await file.text(),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    const text = await response.text()
    console.error(text)
    return
  }
}

const handleDeleteAllData = async () => {
  if (!confirm('Are you sure you want to delete all data?')) {
    return
  }

  await store.mutate.danger_deleteAllData({
    userHasConfirmed: true,
  })
}
</script>

<main>
  <h1>Settings</h1>

  <section>
    <h2>Debug</h2>
    <p>Reset the local state of the replicache store. You may lose unsynced changes.</p>
    <button onclick={handleResetReplicache}>Reset Local State</button>
  </section>

  <section>
    <h2>Streams</h2>
    <StreamManager {store} />
  </section>

  <section>
    <h2>Account Data</h2>

    <h3>Export</h3>
    <p>Export data to a JSON file.</p>
    <a href="/api/internal/export">Export</a>

    <h3>Import</h3>
    <p>Import data from a JSON file.</p>
    <button onclick={handleImport}>Import</button>

    <details class="dangerZone">
      <summary>⚠️ Danger Zone</summary>

      <h3>☠️ Delete all data</h3>
      <p>This will delete all data from the database. This cannot be undone.</p>
      <button onclick={handleDeleteAllData}>Delete all data</button>
    </details>
  </section>

</main>

<style>
  main {
    max-width: var(--width-lg);
    margin-inline: auto;
  }

  .dangerZone {
    background: var(--color-red-300);
    color: var(--color-white);
    padding: var(--size-4);
    border-radius: var(--radius-sm);

    summary {
      font-weight: var(--weight-bold);
    }
  }
</style>

<script lang="ts">
import { dropAllDatabases } from 'replicache'

import type { PageProps } from './$types'

import { enhance } from '$app/forms'

import { resetReplicache } from '#lib/core/replicache/get-replicache.js'

import { watch } from '#lib/utils/watch.svelte.js'

import MetaTaskProgress from '#lib/components/MetaTask/MetaTaskProgress.svelte'
import StreamManager from '#lib/components/StreamManager/StreamManager.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

import { openFilePicker } from '#lib/utils/open-file-picker.js'

const { _: sessionUser } = $derived(watch(store.user.get(store.sessionUserId)))

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

const handleAssignLabelParent = async () => {
  await store.mutate.migrate_fixupLabelParents({})
}
</script>

<main>
  <h1>Settings</h1>

  <section>
    <div class="user">
      {#if sessionUser}
        <span>Logged in as {sessionUser.email}</span>
      {/if}
      <form
        use:enhance={() => {
          return async (event) => {
            await event.update()
            if (event.result.type === 'redirect') {
              await resetReplicache()
              await dropAllDatabases()
              console.log('dropped all the databases')
            }
          }
        }}
        action="/?/logout"
        method="post">
        <button type="submit">Logout</button>
      </form>
    </div>
  </section>

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
    <h2>Assign Parent Labels</h2>
    <p>Scan existing labels and associate them with the correct parent.</p>
    <button onclick={handleAssignLabelParent}>Assign Label Parent</button>
    <MetaTaskProgress {store} name="fixup-all-label-parents" />
  </section>

  <section>
    <h2>Account Data</h2>

    <h3>Export</h3>
    <p>Export data to a JSON file.</p>
    <a href="/api/internal/export">Export</a>

    <h3>Import</h3>
    <p>Import data from a JSON file.</p>
    <button onclick={handleImport}>Import</button>
    <MetaTaskProgress {store} name="import-snapshot" />

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

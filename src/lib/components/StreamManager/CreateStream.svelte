<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'

import { genId } from '#lib/utils/gen-id.js'

type Props = {
  store: Store
}

const { store }: Props = $props()

let name = $state('')
const isValidName = $derived(name.trim().length > 0)

const handleCreateStream = async () => {
  if (!isValidName) {
    return
  }

  await store.mutate.stream_create({
    streamId: genId(),
    name,
  })

  name = ''
}
</script>

<form onsubmit={handleCreateStream}>
  <input bind:value={name} type="text" placeholder="Stream Name" />
  <button type="submit" disabled={!isValidName}>Create</button>
</form>

<style>
  form {
    background: var(--color-grey-100);
    padding: var(--size-4);
    border-radius: var(--radius-sm);
  }
</style>

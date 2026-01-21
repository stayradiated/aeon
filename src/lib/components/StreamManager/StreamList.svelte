<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Stream } from '#lib/types.local.js'

import StreamListItem from './StreamListItem.svelte'

type Props = {
  store: Store
  streamList: Stream[]
}

const { store, streamList }: Props = $props()
</script>

<div class="StreamList">
  {#each streamList as stream (stream.id)}
    <StreamListItem {store} {stream} />
  {/each}
</div>

<style>
  .StreamList {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
  }
</style>

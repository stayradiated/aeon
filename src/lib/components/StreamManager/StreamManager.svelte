<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'

import { getStreamList } from '#lib/core/select/get-stream-list.js'

import { watch } from '#lib/utils/watch.svelte.js'

import CreateStream from './CreateStream.svelte'
import StreamList from './StreamList.svelte'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: streamList } = $derived(watch(getStreamList(store)))
</script>

<section>
  <StreamList {store} {streamList} />
  <CreateStream {store} />
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
  }
</style>

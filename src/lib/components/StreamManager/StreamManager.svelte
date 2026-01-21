<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'

import { getStreamList } from '#lib/core/select/stream.js'

import { query } from '#lib/utils/query.js'

import CreateStream from './CreateStream.svelte'
import StreamList from './StreamList.svelte'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { streamList } = $derived(
  query({
    streamList: getStreamList(store),
  }),
)
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

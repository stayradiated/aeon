<script lang="ts">
import type { StreamId } from '#lib/ids.js'
import type { LayoutProps } from './$types.js'

import { page } from '$app/state'

const { data, children }: LayoutProps = $props()
const { store } = $derived(data)

import { getStreamList } from '#lib/core/select/get-stream-list.js'

import { query } from '#lib/utils/query.js'

const { streamList } = $derived(
  query({
    streamList: getStreamList(store),
  }),
)

const activeStreamId = $derived(page.params.streamId as StreamId)
</script>

<h2>Labels</h2>

<nav>
  {#each streamList as stream (stream.id)}
    <a href="/label/stream/{stream.id}" class:isActive={stream.id === activeStreamId}>{stream.name}</a>
  {/each}
</nav>

{@render children?.()}

<style>
	nav {
		display: flex;
    flex-wrap: wrap;
		gap: var(--size-2);

    a {
      display: block;
      padding: var(--size-2) var(--size-3);
      border-radius: var(--radius-xs);
      background-color: var(--theme-background);
      color: var(--theme-text-main);
      text-decoration: none;

      &:hover {
        background-color: var(--theme-background-alt);
      }

      &.isActive {
        background-color: var(--theme-button-base);
        color: var(--theme-text-bright);

        &:hover {
          background-color: var(--theme-button-hover);
        }
      }
    }
	}
</style>

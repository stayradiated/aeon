<script lang="ts">
import { onMount } from 'svelte'

import type { Store } from '#lib/core/replicache/store.js'

import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
  name: string
}

const { store, name }: Props = $props()

let now = $state(Date.now())

onMount(() => {
  const timer = setInterval(() => {
    now = Date.now()
  }, 1000)

  return () => {
    clearInterval(timer)
  }
})

const { _: metaTask } = $derived(
  watch(
    store.metaTask.find(`name===${name}`, (metaTask) => {
      return metaTask.name === name
    }),
  ),
)

const durationMs = $derived(
  metaTask
    ? (metaTask.lastFinishedAt || now) - metaTask.lastStartedAt
    : undefined,
)
</script>

{#if metaTask}
  <p>
    <code>{metaTask.name}: {metaTask.status} {#if durationMs}({Math.round(durationMs / 1000)}s){/if}</code>
  </p>
{/if}

<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'

import { getUserTimeZone } from '#lib/core/select/get-user-time-zone.js'

import { watch } from '#lib/utils/watch.svelte.js'

import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: userTimeZone } = $derived(watch(getUserTimeZone(store)))

let browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
let selectedTimeZone = $derived(userTimeZone)
const supportedTimeZoneList = Intl.supportedValuesOf('timeZone')

const handleChangeTimeZone = async () => {
  if (selectedTimeZone !== userTimeZone) {
    await store.mutate.user_setTimeZone({ timeZone: selectedTimeZone })
  }
}

const handleUseBrowserTimeZone = async () => {
  if (browserTimeZone !== userTimeZone) {
    await store.mutate.user_setTimeZone({ timeZone: browserTimeZone })
  }
}
</script>

<p>Select a time zone to use for displaying dates.</p>

{#if userTimeZone !== browserTimeZone}
  <p class="info">
    <Emoji native="ℹ️" /> Your browser is using the time zone <code>{browserTimeZone}</code>. <button onclick={handleUseBrowserTimeZone}>Switch?</button>
  </p>
{/if}

<select bind:value={selectedTimeZone} onchange={handleChangeTimeZone}>
  {#each supportedTimeZoneList as timeZone (timeZone)}
    <option value={timeZone}>{timeZone}</option>
  {/each}
</select>

<style>
  .info {
    background: var(--color-yellow-300);
    padding: var(--size-2);
  }
</style>

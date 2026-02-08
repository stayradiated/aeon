<script lang="ts">
import * as dateFns from 'date-fns'

import type { PageProps } from './$types'

import PointManager from '#lib/components/PointManager/PointManager.svelte'

let { data }: PageProps = $props()
const { store } = $derived(data)

let startedAt = $state(dateFns.startOfMinute(new Date()).getTime())
</script>

<main>
  <h3>Add</h3>
  <PointManager {store} initialStartedAt={startedAt} canEditClock />
</main>

<style>
  main {
    max-width: var(--width-md);
    margin: 0 auto;
  }
</style>

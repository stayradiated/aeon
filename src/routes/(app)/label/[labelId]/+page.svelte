<script lang="ts">
import type { LabelId } from '#lib/ids.js'
import type { PageProps } from './$types'

import { page } from '$app/state'

import LabelPage from '#lib/components/LabelPage/LabelPage.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

const labelId = $derived(page.params.labelId as LabelId)
</script>

<main>
  <LabelPage {store} {labelId} />
</main>

<style>
  main {
    max-width: var(--width-md);
    margin-inline: auto;
  }
</style>

<script lang="ts">
import type { LabelId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'
import type { PageProps } from './$types'

import { goto } from '$app/navigation'
import { page } from '$app/state'

import LabelEditor from '#lib/components/LabelManager/LabelEditor.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

const labelId = $derived(page.params.labelId as LabelId)

const handleSubmit = (label: Label) => {
  goto(`/label/stream/${label.streamId}`)
}
</script>

<main>
  <LabelEditor {store} {labelId} onsubmit={handleSubmit} />
</main>

<style>
  main {
    max-width: var(--width-xs);
    margin-inline: auto;
  }
</style>

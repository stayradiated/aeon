<script lang="ts">
import type { StreamId } from '#lib/ids.js'
import type { PageProps } from './$types.js'

import { page } from '$app/state'

import StreamLabelManager from '#lib/components/LabelManager/StreamLabelManager.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)

const streamId = $derived(page.params.streamId as StreamId)
</script>

<StreamLabelManager {store} {streamId} />

<script lang="ts">
import type { PageProps } from './$types'

import MultiDaySliceList from '#lib/components/Log/MultiDaySliceList.svelte'
import Status from '#lib/components/Status/Status.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)
</script>

<Status {store} />

<MultiDaySliceList {store} />

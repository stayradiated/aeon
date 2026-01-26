<script lang="ts">
import type { PageProps } from './$types'

import MultiDaySliceList from '#lib/components/Log/MultiDaySliceList.svelte'

const { data }: PageProps = $props()
const { store } = $derived(data)
</script>

<MultiDaySliceList {store} />

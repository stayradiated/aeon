<script lang="ts">
import type { PageProps } from './$types'

import AddPointForm from '#lib/components/Add/AddPointForm.svelte'

let { data }: PageProps = $props()
const { store } = $derived(data)
</script>

<AddPointForm {store} />

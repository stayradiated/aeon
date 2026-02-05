<script lang="ts">
import type { LayoutProps } from './$types'

import '#lib/theme.css'
import '#lib/normalize.css'

const { children }: LayoutProps = $props()
</script>

<svelte:head>
  <title>ΛΣӨП</title>
</svelte:head>

{@render children?.()}

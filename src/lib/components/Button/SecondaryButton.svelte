<script lang="ts">
import type { ButtonRootProps } from './types.js'

import Button from './Button.svelte'

const props: ButtonRootProps = $props()
</script>

<Button
  {...props}
  data-type="secondary"
/>

<style>
  :global(.Button[data-type="secondary"]) {
    background: var(--color-grey-100);
    padding: var(--size-1) var(--size-3);

    &:hover {
      background: var(--color-grey-200);
    }
  }
</style>

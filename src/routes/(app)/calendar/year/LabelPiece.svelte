<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'

import { watch } from '#lib/utils/watch.svelte.js'

import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  store: Store
  labelId: LabelId
}

const { store, labelId }: Props = $props()

const { _: label } = $derived(watch(store.label.get(labelId)))
</script>

{#if label}
  <div class="labelPiece" style:--color={label.color}>
    {#if label.icon}
      <Emoji native={label.icon} scale={3} />
    {/if}
    <span class="name">{label.name}</span>
  </div>
{/if}

<style>
  .labelPiece {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    background: var(--color);
  }

  .name {
    font-size: var(--scale-00);
    color: contrast-color(var(--color));
  }
</style>

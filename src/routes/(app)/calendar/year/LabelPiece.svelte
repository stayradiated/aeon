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
  <a href="/label/edit/{label.id}" class="labelPiece" style:--color={label.color}>
    {#if label.icon}
      <Emoji native={label.icon} scale={3} />
    {/if}
    <span class="name">{label.name}</span>
  </a>
{/if}

<style>
  .labelPiece {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--size-2);
    background: var(--color);
    text-decoration: none;
    padding-inline: var(--size-2);
  }

  .name {
    font-size: var(--scale-00);
    color: contrast-color(var(--color));
  }
</style>

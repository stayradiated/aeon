<script lang="ts">
import { computed } from 'signia'

import type { Store } from '#lib/core/replicache/store.js'
import type { Line } from '#lib/core/shape/types.js'

import { formatDuration } from '#lib/utils/format-duration.js'
import { watch } from '#lib/utils/watch.svelte.js'

import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  store: Store
  line: Line
}

const { store, line }: Props = $props()

const { _: labelList } = $derived(
  watch(
    computed('labelList', () => {
      const labelList = line.labelIdList.flatMap((labelId) => {
        return store.label.get(labelId).value ?? []
      })
      return labelList
    }),
  ),
)
</script>

{#if labelList.length > 0}
  {#each labelList as label (label.id)}
    <span class="label" style:--color={label.color}>
      {#if label.icon}
        <Emoji native={label.icon} />
      {/if}
      {label.name}
    </span>
  {/each}
  <br />
{/if}

{#if line.description}
  <em>{line.description}</em>
  <br />
{/if}

<code>{formatDuration(line.durationMs)}</code>

<style>
  .label {
    --color: var(--color-grey-100);
    background-color: var(--color);
    color: contrast-color(var(--color));
    padding-inline: var(--size-2);
    border-radius: var(--radius-xs);
  }
</style>

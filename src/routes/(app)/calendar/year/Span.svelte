<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Cell } from '#lib/utils/calendar-grid.js'
import type { CalendarSpan } from '#lib/utils/calendar-span.js'

import { watch } from '#lib/utils/watch.svelte.js'

import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  store: Store
  cell: Cell
  span: CalendarSpan
}

const { store, cell, span }: Props = $props()

const [startDate, endDate, labelId] = $derived(span)
const isStart = $derived(startDate === cell.date)
const isEnd = $derived(endDate === cell.date)

const { _: label } = $derived(watch(store.label.get(labelId)))
</script>

{#if label}
  <a
    href="/label/edit/{label.id}"
    class="Span"
    class:isStart
    class:isEnd
    style:--color={label.color}>

    {#if isStart}
      {#if label.icon}
        <span class="icon"><Emoji native={label.icon} scale={2} /></span>
      {/if}
      <span class="name">{label.name}</span>
      <span class="duration">({endDate - startDate} days)</span>
    {/if}
  </a>
{/if}

<style>
  .Span {
    --color: var(--color-grey-100);
    --height: var(--size-8);

    flex: 1;
    display: flex;
    align-items: center;
    padding-left: var(--size-4);
    gap: var(--size-2);

    background: var(--color);
    text-decoration: none;
    height: var(--height);

    color: contrast-color(var(--color));

    &.isStart {
      border-top-left-radius: var(--height);
      border-bottom-left-radius: var(--height);
    }

    &.isEnd {
      border-top-right-radius: var(--height);
      border-bottom-right-radius: var(--height);
    }
  }

  .icon {
    text-shadow:
      -1px -1px 0 contrast-color(var(--color)),
      -1px  1px 0 contrast-color(var(--color)),
       1px -1px 0 contrast-color(var(--color)),
       1px  1px 0 contrast-color(var(--color));
  }

  .name {
    font-size: var(--scale-00);
    font-weight: var(--weight-bold);
  }

  .duration {
    font-size: var(--scale-00);
  }
</style>

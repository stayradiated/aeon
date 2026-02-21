<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { Label } from '#lib/types.local.js'

import { getTimeZone } from '#lib/core/select/get-time-zone.js'

import { watch } from '#lib/utils/watch.svelte.js'

import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  store: Store
  label: Label
  isSelected: boolean
  onchange?: (isSelected: boolean) => void
}

const { store, label, isSelected, onchange }: Props = $props()
const { _: timeZone } = $derived(watch(getTimeZone(store, Date.now())))

const lastStartedAt = $derived(
  label.lastStartedAt
    ? dateFns.format(label.lastStartedAt, 'd MMM yyyy', {
        in: tz(timeZone),
      })
    : undefined,
)

const handleSelect: ChangeEventHandler<HTMLInputElement> = (event) => {
  const { checked } = event.currentTarget
  onchange?.(checked)
}
</script>

<label class="LabelListItem" style:--local-color={label.color}>
  <div class="checkbox">
    <input
      type="checkbox"
      name="label"
      value={label.id}
      checked={isSelected}
      autocomplete="off"
      onchange={handleSelect}
    />
  </div>
  {#if label.icon}<Emoji native={label.icon} scale={3} />{/if}
  <span class="name">{label.name}</span>
  {#if lastStartedAt}<span class="lastStartedAt">{lastStartedAt}</span>{/if}
  {#if label.pointCount > 0}<span class="pointCount">{label.pointCount}</span>{/if}
  <a class="editBtn" href="/label/edit/{label.id}">Edit</a>
</label>

<style>
  .LabelListItem {
    flex: 1;
    display: flex;
    gap: var(--size-2);
    align-items: center;
    height: var(--size-10);
    max-width: 600px;
    padding-right: var(--size-2);

    &:hover {
      background: var(--color-grey-100);
    }
  }

  .checkbox {
    width: var(--size-10);
    height: var(--size-10);
    background: var(--local-color);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }

  .name {
    flex: 1;
  }

  .pointCount {
    font-size: var(--scale-00);
    color: var(--color-grey-600);
    background: var(--color-grey-100);
    padding-inline: var(--size-2);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
  }

  .lastStartedAt {
    font-size: var(--scale-00);
    color: var(--color-blue-700);
    background: var(--color-grey-100);
    padding-inline: var(--size-2);
    border-radius: var(--radius-sm);
  }

  .editBtn {
    color: var(--color-grey-700);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
</style>

<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'

import { goto } from '$app/navigation'

import { getLabelCount } from '#lib/core/select/get-label-count.js'
import { getLabelLastStartedAt } from '#lib/core/select/get-label-last-started-at.js'
import { getStartYear } from '#lib/core/select/get-start-year.js'
import { getTimeZone } from '#lib/core/select/get-time-zone.js'

import { clockMin } from '#lib/utils/clock.js'
import { subDays } from '#lib/utils/days.js'
import { watch } from '#lib/utils/watch.svelte.js'

import SecondaryButton from '#lib/components/Button/SecondaryButton.svelte'
import Emoji from '#lib/components/Emoji/Emoji.svelte'

import LabelHeatGrid from './LabelHeatGrid.svelte'
import LabelWeekChart from './LabelWeekChart.svelte'

type Props = {
  store: Store
  labelId: LabelId
}

const { store, labelId }: Props = $props()

const { _: now } = $derived(watch(clockMin))

const { _: label } = $derived(watch(store.label.get(labelId)))
const { _: timeZone } = $derived(watch(getTimeZone(store, now)))

const { _: startYear } = $derived(
  label ? watch(getStartYear(store, label.streamId)) : watch.undefined,
)
const thisYear = new Date().getUTCFullYear()

const yearList = $derived(
  startYear
    ? Array.from({ length: thisYear - startYear + 1 }, (_, i) => startYear + i)
    : [thisYear],
)

const { _: labelLastStartedAt } = $derived(
  label
    ? watch(getLabelLastStartedAt(store, label.streamId, labelId))
    : watch.undefined,
)
const { _: pointCount } = $derived(
  label
    ? watch(
        getLabelCount(store, label.streamId, {
          labelId,
          startedAt: { gte: subDays(now, 365), lte: now },
        }),
      )
    : watch.undefined,
)

const handleDelete = async () => {
  if (
    !confirm(
      `Are you sure you want to delete the "${label?.name ?? '<MISSING>'}" label?`,
    )
  ) {
    return
  }
  await store.mutate.label_delete({
    labelId,
  })
  await goto('/log')
}
</script>

{#if !label}
  <h3><Emoji native="⚠️" /> Label not found</h3>
  <p>Could not find a label with the ID <code>{labelId}</code>.</p>
{:else}
  <div class="LabelPage">
    <h2 style:--color={label.color}>{#if label.icon}<Emoji native={label.icon} />{/if}{label.name}</h2>
  </div>

  <SecondaryButton href="/label/edit/{labelId}">
    Edit
  </SecondaryButton>

  <SecondaryButton type="button" onclick={handleDelete}>
    Delete
  </SecondaryButton>

  <p>{pointCount} events in the last year</p>
  {#if labelLastStartedAt}
    <p>Last logged on {dateFns.format(labelLastStartedAt, 'do MMMM yyyy, p', { in: tz(timeZone) })}</p>
  {:else}
    <p>Never used</p>
  {/if}

  <LabelWeekChart {store} {labelId} />

  {#each yearList as year (year)}
    <LabelHeatGrid {store} {labelId} {year} />
  {/each}
{/if}

<style>
  h2 {
    background-color: var(--color);
    color: contrast-color(var(--color));

    display: flex;
    align-items: center;
    flex-direction: row;
    gap: var(--size-2);

    padding: var(--size-2);
  }
</style>

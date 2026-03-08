<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'

import { goto } from '$app/navigation'

import { getDailyDurationList } from '#lib/core/select/get-daily-duration-list.js'
import { getLabelCount } from '#lib/core/select/get-label-count.js'
import { getLabelLastStartedAt } from '#lib/core/select/get-label-last-started-at.js'
import { getTimeZone } from '#lib/core/select/get-time-zone.js'

import * as calDateFns from '#lib/utils/calendar-date.js'
import { clockMin } from '#lib/utils/clock.js'
import { daysToMs, subDays } from '#lib/utils/days.js'
import { formatDuration } from '#lib/utils/format-duration.js'
import { watch } from '#lib/utils/watch.svelte.js'

import SecondaryButton from '#lib/components/Button/SecondaryButton.svelte'
import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  store: Store
  labelId: LabelId
}

const { store, labelId }: Props = $props()

const RANGE_DAYS = 30

const { _: now } = $derived(watch(clockMin))

const rangeStart = $derived(subDays(now, RANGE_DAYS))
const rangeEnd = $derived(now)

const { _: label } = $derived(watch(store.label.get(labelId)))
const { _: timeZone } = $derived(watch(getTimeZone(store, now)))
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

const { _: dailyDurationList } = $derived(
  label
    ? watch(
        getDailyDurationList(
          store,
          label.streamId,
          { startedAt: { gte: rangeStart, lte: rangeEnd }, labelId },
          now,
        ),
      )
    : watch.lit([]),
)

const totalDurationMs = $derived(
  dailyDurationList.reduce((sum, entry) => {
    return sum + entry.durationMs
  }, 0),
)

const totalPercentage = $derived(totalDurationMs / daysToMs(RANGE_DAYS))

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
    <p>Last used {dateFns.format(labelLastStartedAt, 'do MMMM yyyy, p', { in: tz(timeZone) })}</p>
  {:else}
    <p>Never used</p>
  {/if}

  <p>Total duration over last {RANGE_DAYS} days: {formatDuration(totalDurationMs)} ({Math.round(totalPercentage*100)}%)</p>

  {#each dailyDurationList.toReversed() as entry (entry.date)}
    <h4>{calDateFns.format(entry.date, 'do MMM yyyy')}</h4>
    <p>{formatDuration(entry.durationMs)}</p>
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

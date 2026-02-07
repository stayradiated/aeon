<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { PageProps } from './$types'

import { goto } from '$app/navigation'
import { page } from '$app/state'

import { getActivePointRecord } from '#lib/core/select/get-active-point-record.js'
import { getTimeZone } from '#lib/core/select/get-time-zone.js'

import { watch } from '#lib/utils/watch.svelte.js'

import PointManager from '#lib/components/PointManager/PointManager.svelte'

let { data }: PageProps = $props()
const { store } = $derived(data)

const startedAt = Number.parseInt(page.params.startedAt ?? '-1', 10)

const { _: timeZone } = $derived(watch(getTimeZone(store, startedAt)))
const { _: pointRecord } = $derived(
  watch(getActivePointRecord(store, startedAt)),
)
const DATE_FORMAT = `yyyy-MM-dd'T'HH:mm`

let timestamp = $derived(
  dateFns.format(startedAt, DATE_FORMAT, {
    in: tz(timeZone),
  }),
)

const userStartedAt = $derived(
  dateFns
    .parse(timestamp, DATE_FORMAT, new Date(), {
      in: tz(timeZone),
    })
    .getTime(),
)

const handleSlide = async (event: SubmitEvent) => {
  event.preventDefault()

  if (startedAt !== userStartedAt) {
    for (const point of Object.values(pointRecord)) {
      if (point.startedAt === startedAt) {
        await store.mutate.point_setStartedAt({
          pointId: point.id,
          startedAt: userStartedAt,
        })
      }
    }
  }

  await goto('/log')
}
</script>

<main>
  <h3>Edit</h3>

  <form class="slide" onsubmit={handleSlide}>
    <fieldset>
      <input
        type="datetime-local"
        name="startedAtLocal"
        bind:value={timestamp}
      />
      <button type="submit" disabled={userStartedAt === startedAt}>Adjust Time</button>
    </fieldset>
  </form>

  <PointManager {store} initialStartedAt={startedAt} />
</main>

<style>
  main {
    max-width: var(--width-md);
    margin: 0 auto;
  }

  form.slide {
    fieldset {
      display: flex;
      gap: var(--size-2);
      padding: var(--size-2);
      border: var(--size-px) solid var(--theme-border);
      border-radius: var(--radius-xs);
    }

    input {
      flex: 1;
      background: var(--theme-background);
      color: var(--theme-text-main);
      border: none;
      border-radius: var(--radius-xs);
      line-height: var(--line-xl);
    }

    button {
      background: var(--theme-button-base);
      border-radius: var(--radius-sm);
      padding-inline: var(--size-2);
      border: none;

      &:hover {
        background-color: var(--theme-button-hover);
      }
      &:disabled {
        background: var(--theme-background-alt);
      }
    }
  }
</style>

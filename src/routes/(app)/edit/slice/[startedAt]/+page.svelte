<script lang="ts">
import { formatInTimeZone, toDate } from 'date-fns-tz'

import type { PageProps } from './$types'

import { goto } from '$app/navigation'
import { page } from '$app/state'

import { getActivePointRecord } from '#lib/core/select/get-active-point-record.js'
import { getStreamList } from '#lib/core/select/get-stream-list.js'
import { getUserTimeZone } from '#lib/core/select/get-user-time-zone.js'

import { query } from '#lib/utils/query.js'

let { data }: PageProps = $props()
const { store } = $derived(data)

const startedAt = Number.parseInt(page.params.startedAt ?? '-1', 10)

const { timeZone, pointRecord, streamList } = $derived(
  query({
    timeZone: getUserTimeZone(store),
    pointRecord: getActivePointRecord(store, startedAt),
    streamList: getStreamList(store),
  }),
)

let timestamp = $derived(
  formatInTimeZone(startedAt, timeZone, 'yyyy-MM-dd HH:mm'),
)

const handleSlide = async (event: SubmitEvent) => {
  event.preventDefault()
  const nextStartedAt = toDate(timestamp, { timeZone }).getTime()
  if (startedAt !== nextStartedAt) {
    for (const point of Object.values(pointRecord)) {
      if (point.startedAt === startedAt) {
        await store.mutate.point_slide({
          pointId: point.id,
          startedAt: nextStartedAt,
        })
      }
    }
  }

  await goto('/log')
}

const handleDelete = async () => {
  const confirm = window.confirm('Are you sure you want to delete this point?')
  if (!confirm) {
    return
  }

  for (const point of Object.values(pointRecord)) {
    if (point.startedAt === startedAt) {
      await store.mutate.point_delete({ pointId: point.id })
    }
  }

  await goto('/log')
}
</script>

<form onsubmit={handleSlide}>
  <input
    type="datetime-local"
    name="startedAtLocal"
    bind:value={timestamp}
  />
  <button type="submit">Update</button>
</form>

<ul>
  {#each streamList as stream (stream.id)}
    {@const point = pointRecord[stream.id]}
    {#if point}
      {@const isActive = point.startedAt === startedAt}
      <li class="stream" class:isActive>
        <strong>{stream.name}:</strong><code>{point.description}</code>
        <ul>
          {#each point.labelIdList as labelId (labelId)}
            {@const label = store.label.get(labelId).value}
            {#if label}
              <li>
                {label.icon} {label.name}
              </li>
            {/if}
          {/each}
        </ul>
      </li>
    {/if}
  {/each}
</ul>

<button type="button" onclick={handleDelete}>Delete Points</button>

<style>
  li.stream:not(.isActive) {
    opacity: 0.8;
  }
  li.isActive > strong {
    background: var(--color-yellow-300);
  }
</style>

<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { StreamState } from '#lib/components/Add/StreamStatus.svelte'
import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId, StreamId } from '#lib/ids.js'

import { goto } from '$app/navigation'

import { getActivePoint } from '#lib/core/select/get-active-point.js'
import { getStreamList } from '#lib/core/select/get-stream-list.js'
import { getTimeZone } from '#lib/core/select/get-time-zone.js'
import { getTimeZoneStream } from '#lib/core/select/get-time-zone-stream.js'

import { clock } from '#lib/utils/clock.js'
import { genId } from '#lib/utils/gen-id.js'
import { objectEntries } from '#lib/utils/object-entries.js'
import { topoSortParentsFirst } from '#lib/utils/topo-sort-parents-first'
import { watch } from '#lib/utils/watch.svelte.js'

import TimeZoneManager from '#lib/components/TimeZoneManager/TimeZoneManager.svelte'

import StreamStatus from './StreamStatus.svelte'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: now } = $derived(watch(clock))
const { _: timeZone } = $derived(watch(getTimeZone(store, now)))
const { _: streamList } = $derived(watch(getStreamList(store)))
const { _: timeZoneStream } = $derived(watch(getTimeZoneStream(store)))

let formState = $state.raw<Record<StreamId, StreamState | undefined>>({})

const DATE_FORMAT = "yyyy-MM-dd'T'HH:mm"

let [nowDate, nowTime] = $derived(
  dateFns
    .format(clock.value, DATE_FORMAT, {
      in: tz(timeZone),
    })
    .split('T'),
)
const currentTime = $derived(
  dateFns
    .parse(`${nowDate}T${nowTime}`, DATE_FORMAT, new Date(), {
      in: tz(timeZone),
    })
    .getTime(),
)

const handleNow = (_event: MouseEvent) => {
  ;[nowDate, nowTime] = dateFns
    .format(clock.value, DATE_FORMAT, {
      in: tz(timeZone),
    })
    .split('T')
}

const handleSubmit = async () => {
  const unsortedFormStateEntryList = objectEntries(formState).flatMap(
    ([streamId, state]) => {
      // ignore streams that have not been changed
      if (typeof state === 'undefined') {
        return []
      }

      const stream = streamList.find((stream) => stream.id === streamId)
      if (!stream) {
        throw new Error(`Could not not find streamId: ${streamId}`)
      }

      return [[streamId, { state, stream }]] as const
    },
  )

  // sort streams so that parents are listed before children
  // this ensures we always update the parent points before children
  const formStateEntryList = topoSortParentsFirst({
    items: unsortedFormStateEntryList,
    getId: ([streamId]) => streamId,
    getParentIdList: ([_streamId, { stream }]) =>
      stream.parentId ? [stream.parentId] : [],
  })
  if (formStateEntryList instanceof Error) {
    console.error(formStateEntryList)
    return
  }

  for (const [streamId, { state, stream }] of formStateEntryList) {
    const { description, labelIdList, createdLabelList } = state

    // lookup the parent point if it exists
    const parentPoint = stream.parentId
      ? getActivePoint(store, stream.parentId, currentTime).value
      : undefined
    const parentLabelIdList: LabelId[] = parentPoint
      ? [...parentPoint.labelIdList]
      : []

    // create all labels necessary
    await Promise.all(
      createdLabelList.map(async (label): Promise<void> => {
        await store.mutate.label_create({
          labelId: label.id,
          streamId,
          name: label.name,
          color: undefined,
          icon: undefined,
          parentLabelIdList,
        })
      }),
    )

    // update existing labels to use new labelIds
    for (const labelId of labelIdList) {
      const label = store.label.get(labelId).value
      if (!label) {
        console.warn(`Could not find labelId: ${labelId}`)
        continue
      }
      for (const parentLabelId of parentLabelIdList) {
        if (!label.parentLabelIdList.includes(parentLabelId)) {
          await store.mutate.label_addParentLabel({
            labelId,
            parentLabelId,
          })
        }
      }
    }

    await store.mutate.point_create({
      pointId: genId(),
      streamId,
      description,
      labelIdList,
      startedAt: currentTime,
    })
  }

  void goto('/log')
}

const handleChangeTimeZone = (timeZone: string) => {
  if (!timeZoneStream) {
    return
  }
  formState = {
    ...formState,
    [timeZoneStream.id]: {
      description: timeZone,
      labelIdList: [],
      createdLabelList: [],
    },
  }
}
</script>

<main>
  {#each streamList as stream (stream.id)}
    {#if stream.id === timeZoneStream?.id}
      {@const selectedTimeZone = formState[stream.id]?.description ?? timeZone}
      <TimeZoneManager timeZone={selectedTimeZone} onChange={handleChangeTimeZone} />
    {:else}
      {@const parentState = stream.parentId ? formState[stream.parentId] : undefined}
      <StreamStatus
        {store}
        {stream}
        {currentTime}
        {parentState}
        state={formState[stream.id]}
        onchange={(state) => {
          formState = { ...formState, [stream.id]: state }
        }}
      />
    {/if}
  {/each}

  <div class="datetime-row">
    <input
      required
      type="date"
      class="date-input"
      name="startedAtDate"
      bind:value={nowDate}
    />
    <input
      required
      type="time"
      class="time-input"
      name="startedAtTime"
      bind:value={nowTime}
    />

    <p class="datetime-relative">
      {dateFns.formatDistance(currentTime, now, { includeSeconds: true, addSuffix: true })}
    </p>
    <button type="button" class="now-button" onclick={handleNow}>Now</button>
  </div>

  <button type="button" onclick={handleSubmit} class="save-button">Save</button>
</main>

<style>
  main {
    max-width: var(--width-md);
    margin: 0 auto;

    display: flex;
    flex-direction: column;
    padding: var(--size-3);
    gap: var(--size-2);
  }

  input {
    background: var(--theme-background);
    color: var(--theme-text-main);
    border: none;
    border-radius: var(--radius-xs);
    line-height: var(--line-xl);
  }

  .save-button {
    line-height: 3rem;
    background: var(--theme-button-base);
    color: var(--theme-text-bright);
    border: var(--size-px) solid var(--theme-border);
    border-radius: var(--radius-xs);
  }
  .save-button:hover {
    background-color: var(--theme-button-hover);
  }

  .datetime-row {
    display: grid;
    grid-template-areas:
      'date-input time-input now'
      'datetime-relative datetime-relative datetime-relative';
    gap: var(--size-2);
  }

  .date-input {
    grid-area: date-input;
  }
  .time-input {
    grid-area: time-input;
  }

  .datetime-relative {
    text-align: right;
    color: var(--theme-text-muted);
    grid-area: datetime-relative;
    text-align: center;
    margin: 0;
    line-height: var(--line-md);
  }

  .now-button {
    background: none;
    border: none;
    cursor: pointer;
    grid-area: now;
    text-transform: uppercase;
    font-size: var(--scale-000);
    color: var(--theme-text-muted);
    font-weight: var(--weight-bold);
  }
  .now-button:hover {
    color: var(--theme-text-main);
  }
</style>

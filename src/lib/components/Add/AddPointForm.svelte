<script lang="ts">
import * as dateFns from 'date-fns'
import { formatInTimeZone, toDate, toZonedTime } from 'date-fns-tz'

import type { StreamState } from '#lib/components/Add/StreamStatus.svelte'
import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId, StreamId } from '#lib/ids.js'

import { goto } from '$app/navigation'

import { getActivePoint } from '#lib/core/select/get-active-point.js'
import { getStreamList } from '#lib/core/select/get-stream-list.js'
import { getUserTimeZone } from '#lib/core/select/get-user-time-zone.js'

import { clock } from '#lib/utils/clock.js'
import { genId } from '#lib/utils/gen-id.js'
import { objectEntries } from '#lib/utils/object-entries.js'
import { watch } from '#lib/utils/watch.svelte.js'

import StreamStatus from './StreamStatus.svelte'

type Props = {
  store: Store
}

const { store }: Props = $props()

const { _: now } = $derived(watch(clock))
const { _: timeZone } = $derived(watch(getUserTimeZone(store)))
const { _: streamList } = $derived(watch(getStreamList(store)))

let formState = $state.raw<Record<StreamId, StreamState>>({})

let [nowDate, nowTime] = $derived(
  formatInTimeZone(clock.value, timeZone, "yyyy-MM-dd'T'HH:mm").split('T'),
)
const currentTime = $derived(
  toZonedTime(toDate(`${nowDate}T${nowTime}:00`), timeZone).getTime(),
)

const handleNow = (_event: MouseEvent) => {
  ;[nowDate, nowTime] = formatInTimeZone(
    clock.value,
    timeZone,
    "yyyy-MM-dd'T'HH:mm",
  ).split('T')
}

const handleSubmit = async () => {
  for (const [streamId, state] of objectEntries(formState)) {
    if (!state) {
      // ignore streams that have not been changed
      continue
    }
    const { description, labelIdList, createdLabelList } = state

    const stream = streamList.find((stream) => stream.id === streamId)
    if (!stream) {
      console.warn(`Could not not find streamId: ${streamId}`)
      continue
    }

    // create all labels necessary
    await Promise.all(
      createdLabelList.map(async (label): Promise<void> => {
        let parentLabelIdList: LabelId[] = []

        if (stream.parentId) {
          const parentPoint = getActivePoint(
            store,
            stream.parentId,
            currentTime,
          ).value
          if (parentPoint) {
            parentLabelIdList = [...parentPoint.labelIdList]
          }
        }

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
</script>

<main>
  {#each streamList as stream (stream.id)}
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

<script lang="ts">
import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId, StreamId } from '#lib/ids.js'
import type { PointInputValue } from './PointInput.svelte'
import type { StreamState } from './StreamStatus.svelte'

import { goto } from '$app/navigation'

import { getActivePoint } from '#lib/core/select/get-active-point.js'
import { getStreamList } from '#lib/core/select/get-stream-list.js'
import { getTimeZone } from '#lib/core/select/get-time-zone.js'
import { getTimeZoneStream } from '#lib/core/select/get-time-zone-stream.js'

import { clock } from '#lib/utils/clock.js'
import { genId } from '#lib/utils/gen-id.js'
import { isSetEqual } from '#lib/utils/is-set-equal.js'
import { objectEntries } from '#lib/utils/object-entries.js'
import { topoSortParentsFirst } from '#lib/utils/topo-sort-parents-first'
import { watch } from '#lib/utils/watch.svelte.js'

import TimeZoneManager from '#lib/components/TimeZoneManager/TimeZoneManager.svelte'

import PointInput from './PointInput.svelte'
import StreamStatus from './StreamStatus.svelte'

const DATE_FORMAT = "yyyy-MM-dd'T'HH:mm"

type Props = {
  store: Store
  initialStartedAt: number
  canEditClock?: boolean
}

const { store, initialStartedAt, canEditClock }: Props = $props()

const { _: now } = $derived(watch(clock))
const { _: streamList } = $derived(watch(getStreamList(store)))
const { _: timeZoneStream } = $derived(watch(getTimeZoneStream(store)))
const { _: initialTimeZone } = $derived(
  watch(getTimeZone(store, initialStartedAt)),
)

let formState = $state.raw<Record<StreamId, StreamState | undefined>>({})
let timeZone = $derived(initialTimeZone)

let [initialDate, initialTime] = $derived(
  dateFns
    .format(initialStartedAt, DATE_FORMAT, { in: tz(timeZone) })
    .split('T'),
)

// timestamp derived from the user clock
const visibleTimestamp = $derived(
  dateFns
    .parse(`${initialDate}T${initialTime}`, DATE_FORMAT, new Date(), {
      in: tz(timeZone),
    })
    .getTime(),
)

// adjust the user clock to the current time
const handleSetNow = (_event: MouseEvent) => {
  ;[initialDate, initialTime] = dateFns
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
    const activePoint = getActivePoint(store, stream.id, visibleTimestamp).value

    if (state?.type === 'delete') {
      // delete the point
      if (activePoint) {
        await store.mutate.point_delete({ pointId: activePoint.id })
      }
      continue
    }

    // assume state.type === 'edit'
    const { description, labelIdList, createdLabelList } = state

    // lookup the parent point if it exists
    const parentPoint = stream.parentId
      ? getActivePoint(store, stream.parentId, visibleTimestamp).value
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

    if (activePoint?.startedAt === visibleTimestamp) {
      // edit existing point
      if (description !== activePoint.description) {
        await store.mutate.point_setDescription({
          pointId: activePoint.id,
          description,
        })
      }
      if (!isSetEqual(labelIdList, activePoint.labelIdList)) {
        await store.mutate.point_setLabelIdList({
          pointId: activePoint.id,
          labelIdList,
        })
      }
    } else {
      // create new point
      await store.mutate.point_create({
        pointId: genId(),
        streamId,
        description,
        labelIdList,
        startedAt: visibleTimestamp,
      })
    }
  }

  if (timeZone !== initialTimeZone && timeZoneStream) {
    await store.mutate.point_create({
      pointId: genId(),
      streamId: timeZoneStream.id,
      description: timeZone,
      labelIdList: [],
      startedAt: visibleTimestamp,
    })
  }

  void goto('/log')
}

const handleChangeTimeZone = (nextTimeZone: string) => {
  if (!timeZoneStream) {
    return
  }
  timeZone = nextTimeZone
}

const handlePointInputChange = (streamId: StreamId, value: PointInputValue) => {
  const prevState = formState[streamId]
  if (prevState?.type === 'edit') {
    formState = {
      ...formState,
      [streamId]: {
        type: 'edit',
        description: value.description ?? prevState.description,
        labelIdList: value.labelIdList ?? prevState.labelIdList,
        createdLabelList: value.createdLabelList ?? prevState.createdLabelList,
      },
    }
  }
}

const handleReset = (streamId: StreamId) => {
  formState = {
    ...formState,
    [streamId]: undefined,
  }
}
</script>

<div class="PointManager">
  {#each streamList as stream (stream.id)}
    {#if stream.id === timeZoneStream?.id}
      <TimeZoneManager
        {timeZone}
        onChange={handleChangeTimeZone}
      />
    {:else}
      {@const state = formState[stream.id]}
      {#if state?.type === 'edit'}
        {@const parentState = stream.parentId ? formState[stream.parentId] : undefined}
        <PointInput
          autofocus
          {store}
          {stream}
          currentTime={visibleTimestamp}
          parentLabelIdList={parentState?.type === 'edit' ? parentState.labelIdList : undefined}
          description={state.description}
          labelIdList={state.labelIdList}
          createdLabelList={state.createdLabelList}
          onchange={(value) => handlePointInputChange(stream.id, value)}
          onreset={() => handleReset(stream.id)}
        />
      {:else}
        <StreamStatus
          {store}
          {stream}
          {state}
          currentTime={visibleTimestamp}
          onchange={(state) => {
            formState = { ...formState, [stream.id]: state }
          }}
        />
      {/if}
    {/if}
  {/each}

  <div class="datetime-row">
    <input
      required
      type="date"
      class="date-input"
      name="startedAtDate"
      bind:value={initialDate}
      disabled={!canEditClock}
    />
    <input
      required
      type="time"
      class="time-input"
      name="startedAtTime"
      bind:value={initialTime}
      disabled={!canEditClock}
    />

    <p class="datetime-relative">
      {dateFns.formatDistance(visibleTimestamp, now, { includeSeconds: true, addSuffix: true })}
    </p>
    <button type="button" class="now-button" onclick={handleSetNow} disabled={!canEditClock}>Now</button>
  </div>

  <button type="button" onclick={handleSubmit} class="save-button">Save</button>
</div>

<style>
  .PointManager {
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

    &:hover {
      color: var(--theme-text-main);
    }
    &:disabled {
      color: var(--color-grey-400);
      cursor: not-allowed;
      text-decoration: line-through;
    }
  }
</style>

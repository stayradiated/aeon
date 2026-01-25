<script lang="ts">
import * as dateFns from 'date-fns'
import { formatInTimeZone, toDate, toZonedTime } from 'date-fns-tz'

import type { StreamId } from '#lib/ids.js'
import type { PageProps } from './$types'
import type { StreamState } from './StreamStatus.svelte'

import { getStreamList } from '#lib/core/select/stream.js'
import { getTimeZone } from '#lib/core/select/user.js'

import { clock } from '#lib/utils/clock.js'
import { query } from '#lib/utils/query.js'

import StreamStatus from './StreamStatus.svelte'
import { handleFormSubmit } from './submit.js'

let { data }: PageProps = $props()
const { store } = $derived(data)

const { now, timeZone, streamList } = $derived(
  query({
    now: clock,
    timeZone: getTimeZone(store),
    streamList: getStreamList(store),
  }),
)

let formState = $state.raw<Record<StreamId, StreamState>>({})

let [nowDate, nowTime] = $derived(
  formatInTimeZone(clock.value, timeZone, "yyyy-MM-dd'T'HH:mm").split('T'),
)
const currentTime = $derived(
  toZonedTime(toDate(`${nowDate}T${nowTime}:00`), timeZone).getTime(),
)

const handleSubmit = async (event: SubmitEvent) => {
  event.preventDefault()
  await handleFormSubmit({
    store,
    currentTime,
    formState: $state.snapshot(formState),
  })
}

const handleNow = (_event: MouseEvent) => {
  ;[nowDate, nowTime] = formatInTimeZone(
    clock.value,
    timeZone,
    "yyyy-MM-dd'T'HH:mm",
  ).split('T')
}
</script>

<main>
  <form onsubmit={handleSubmit}>
    {#each streamList as stream (stream.id)}
      {@const parentState = stream.parentId ? formState[stream.parentId] : undefined}
      {@const parentLabelIdList = parentState
        ? parentState.labelList.flatMap((label) => {
          return 'id' in label ? label.id : []
        })
        : undefined}
      <StreamStatus
        {store}
        {stream}
        {parentLabelIdList}
        {currentTime}
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

    <button type="submit" class="save-button">Save</button>
  </form>
</main>

<style>
  main {
    max-width: var(--width-md);
    margin: 0 auto;
  }

  form {
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

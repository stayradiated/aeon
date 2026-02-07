<script lang="ts">
import type { ChangeEventHandler } from 'svelte/elements'

import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  timeZone: string
  onChange: (timeZone: string) => void
}

const { timeZone, onChange }: Props = $props()

let browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const supportedTimeZoneList = Intl.supportedValuesOf('timeZone')

const handleChangeTimeZone: ChangeEventHandler<HTMLSelectElement> = async (
  event,
) => {
  const selectedTimeZone = event.currentTarget.value
  if (selectedTimeZone !== timeZone) {
    onChange(selectedTimeZone)
  }
}

const handleUseBrowserTimeZone = async () => {
  if (browserTimeZone !== timeZone) {
    onChange(browserTimeZone)
  }
}
</script>

<div class="TimeZoneManager">
  <div class="label">Time Zone</div>

  {#if timeZone !== browserTimeZone}
    <p class="info">
      <Emoji native="ℹ️" /> Your browser is using the time zone <code>{browserTimeZone}</code>. <button onclick={handleUseBrowserTimeZone}>Switch?</button>
    </p>
  {/if}

  <select value={timeZone} onchange={handleChangeTimeZone}>
    {#each supportedTimeZoneList as timeZone (timeZone)}
      <option value={timeZone}>{timeZone}</option>
    {/each}
  </select>
</div>

<style>
  .TimeZoneManager {
    padding: 0 var(--size-3);
    background: var(--theme-background);
    border: none;
    color: var(--theme-text-main);
    border-radius: var(--radius-xs);
    cursor: pointer;
    justify-content: space-between;
    line-height: var(--line-xl);
    border-bottom: 1px solid var(--theme-border);
  }

  .label {
    font-weight: var(--weight-bold);
    font-size: var(--scale-1);
  }

  .info {
    background: var(--color-yellow-300);
    padding: var(--size-2);
  }
</style>

<script lang="ts">
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { StreamId } from '#lib/ids.js'

import { getStreamList } from '#lib/core/select/get-stream-list.js'

import { createDebounce } from '#lib/utils/debounce.js'
import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
}

const { store }: Props = $props()
const uid = $props.id()

const { _: streamList } = $derived(watch(getStreamList(store)))
const { _: status } = $derived(watch(store.status.get(store.sessionUserId)))
const { _: user } = $derived(watch(store.user.get(store.sessionUserId)))

const isEnabled = $derived(status?.isEnabled ?? false)
const streamIdList = $derived(status?.streamIdList ?? [])

let newSlackToken = $state('')
let prompt = $derived(status?.prompt ?? '')

const handleToggleEnabled: ChangeEventHandler<HTMLInputElement> = async (
  event,
) => {
  const { checked } = event.currentTarget
  await store.mutate.status_toggleEnabled({
    isEnabled: checked,
  })
}

const setPrompt = createDebounce(500, (prompt: string) => {
  void store.mutate.status_setPrompt({ prompt })
})

const handleChangePrompt: ChangeEventHandler<HTMLTextAreaElement> = async (
  _event,
) => {
  if (prompt !== status?.prompt) {
    setPrompt(prompt)
  }
}

const handleChangeStream: ChangeEventHandler<HTMLInputElement> = async (
  event,
) => {
  const { checked, value } = event.currentTarget
  const streamId = value as StreamId
  await store.mutate.status_toggleStream({ streamId, isEnabled: checked })
}

const handleSetSlackToken = async () => {
  await store.mutate.user_setSlackToken({ slackToken: newSlackToken })
  newSlackToken = ''
}
const handleRemoveSlackToken = async () => {
  await store.mutate.user_setSlackToken({ slackToken: undefined })
}
</script>

<div>
  <label>
    <input type="checkbox" checked={isEnabled} onchange={handleToggleEnabled} />
    <span>Enabled</span>
  </label>
</div>

<fieldset disabled={!isEnabled}>
  <div>
    <h4>Prompt</h4>
    <textarea id="prompt-{uid}" bind:value={prompt} rows="4" oninput={handleChangePrompt}></textarea>
  </div>

  <div>
    <h4>Streams</h4>
    <ul>
      {#each streamList as stream (stream.id)}
        {@const isChecked = streamIdList.includes(stream.id)}
        <li>
          <label>
            <input type="checkbox" value={stream.id} checked={isChecked} onchange={handleChangeStream} />
            {stream.name}
          </label>
        </li>
      {/each}
    </ul>
  </div>

  <div>
    <h4>Slack Integration</h4>
    {#if user?.slackTokenMasked}
      <label>Slack API Key
        <input type="text" disabled value={user.slackTokenMasked} />
      </label>
      <button type="button" onclick={handleRemoveSlackToken}>Remove</button>
    {:else}
      <label>Slack API Key
        <input type="text" placeholder="Enter Slack API Key" bind:value={newSlackToken} />
      </label>
      <button type="button" onclick={handleSetSlackToken}>Set</button>
    {/if}
  </div>
</fieldset>

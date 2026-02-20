<script lang="ts">
import { tick } from 'svelte'
import ColorPicker from 'svelte-awesome-color-picker'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { watch } from '#lib/utils/watch.svelte.js'

import Emoji from '#lib/components/Emoji/Emoji.svelte'
import EmojiPicker from '#lib/components/Emoji/EmojiPicker.svelte'

import SelectLabel from './SelectLabel.svelte'

type Props = {
  store: Store
  labelId: LabelId
  onsubmit?: (label: Label) => void
}

const { store, labelId, onsubmit }: Props = $props()
const uid = $props.id()

const { _: label } = $derived(watch(store.label.get(labelId)))
const { _: stream } = $derived(
  label ? watch(store.stream.get(label.streamId)) : watch.undefined,
)

let parentLabelIdList = $state<LabelId[]>([])
let color = $state<string>()
let icon = $state<string>()
let name = $state<string>('')

let lastInitializedLabelId: LabelId | undefined
$effect(() => {
  if (label && label.id !== lastInitializedLabelId) {
    lastInitializedLabelId = label.id
    parentLabelIdList = [...label.parentLabelIdList]
    color = label.color
    icon = label.icon
    name = label.name
  }
})

const handleSubmit = async () => {
  if (!label) {
    return
  }
  if (name !== label.name) {
    await store.mutate.label_rename({ labelId, name })
  }
  if (color !== label.color) {
    await store.mutate.label_setColor({ labelId, color })
  }
  if (icon !== label.icon) {
    await store.mutate.label_setIcon({ labelId, icon })
  }
  for (const parentLabelId of label.parentLabelIdList) {
    if (!parentLabelIdList.includes(parentLabelId)) {
      await store.mutate.label_removeParentLabel({ labelId, parentLabelId })
    }
  }
  for (const parentLabelId of parentLabelIdList) {
    if (!label.parentLabelIdList.includes(parentLabelId)) {
      await store.mutate.label_addParentLabel({ labelId, parentLabelId })
    }
  }

  // by awaiting tick(), the `label` variable will be updated
  // with the latest state
  await tick()
  onsubmit?.(label)
}
</script>

<h2>Edit Label</h2>

{#if label}
  <div class="LabelEditor">
    <div>
      <label>Name
        <input type="text" name="name" bind:value={name} /></label>
    </div>

    <div>
      <label>Icon
        <EmojiPicker onselect={(value) => icon = value}>
          {#snippet button(toggle)}
            <button type="button" onclick={toggle}>
              {#if icon}<Emoji native={icon} scale={3} />{:else}Add Icon{/if}
            </button>
            {#if icon}<button type="button" onclick={() => icon = undefined}>Remove</button>{/if}
          {/snippet}
        </EmojiPicker>
      </label>
    </div>

    <div>
      <label>
        Color
        {#if color}
          <ColorPicker hex={color} isAlpha={false} isDialog={false} onInput={(value) => color = (value.hex ?? undefined)} />
          <button type="button" onclick={() => color =(undefined)}>Remove Color</button>
        {:else}
          <button type="button" onclick={() => color =('#fff')}>Set Color</button>
        {/if}
      </label>
    </div>

    <div>
      <label for="parent-{uid}">Parent</label>
      {#if stream?.parentId}
        <SelectLabel
          id="parent-{uid}"
          {store}
          streamId={stream.parentId}
          value={parentLabelIdList}
          onchange={(value) => parentLabelIdList = value}
        />
      {:else}
        <p>n/a</p>
      {/if}
    </div>

    <button onclick={handleSubmit}>Save</button>
  </div>
{:else}
  <p>⚠️ Label not found</p>
{/if}

<style>
  .LabelEditor {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
  }
</style>

<script lang="ts">
import { tick } from 'svelte'
import ColorPicker from 'svelte-awesome-color-picker'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import { query } from '#lib/utils/query.js'

import Emoji from './Emoji.svelte'
import EmojiPicker from './EmojiPicker.svelte'
import SelectLabel from './SelectLabel.svelte'

type Props = {
  store: Store
  labelId: LabelId
  onsubmit?: (label: Label) => void
}

const { store, labelId, onsubmit }: Props = $props()

const { label, stream } = $derived(
  query(() => {
    const label = store.label.get(labelId).value
    const stream = label ? store.stream.get(label.streamId).value : undefined
    return { label, stream }
  }),
)

let parentId = $state<LabelId>()
let color = $state<string>()
let icon = $state<string>()
let name = $state<string>('')

let lastInitializedLabelId: LabelId | undefined
$effect(() => {
  if (label && label.id !== lastInitializedLabelId) {
    parentId = label.parentId
    color = label.color
    icon = label.icon
    name = label.name
  }
})

const handleSubmit = async () => {
  if (!label) {
    return
  }
  if (parentId !== label.parentId) {
    await store.mutate.label_setParent({ labelId, parentId })
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
      <label>Parent
        {#if stream?.parentId}
          <SelectLabel {store} streamId={stream.parentId} value={parentId} onchange={(value) => parentId = value} />
        {:else}
          <p>n/a</p>
        {/if}
      </label>
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
      <label>Name
        <input type="text" name="name" bind:value={name} /></label>
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

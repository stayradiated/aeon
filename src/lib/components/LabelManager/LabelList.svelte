<script lang="ts">
import type { ChangeEventHandler } from 'svelte/elements'

import type { Store } from '#lib/core/replicache/store.js'
import type { LabelId } from '#lib/ids.js'
import type { Label } from '#lib/types.local.js'

import Emoji from './Emoji.svelte'

type Props = {
  store: Store
  parentLabel: Label | undefined
  labelList: Label[]
}

const { parentLabel, labelList }: Props = $props()

let selectedLabelIdList: LabelId[] = $state([])
let selectedAll = $derived(selectedLabelIdList.length === labelList.length)

const handleToggleAll: ChangeEventHandler<HTMLInputElement> = (event) => {
  const { checked } = event.currentTarget

  if (checked) {
    selectedLabelIdList = labelList.map((label) => label.id)
  } else {
    selectedLabelIdList = []
  }
}
</script>

<section class="LabelList">
  {#if parentLabel}
    <h4 id="label-{parentLabel.id}">{parentLabel.icon ? parentLabel.icon + ' ' : ''}{parentLabel.name}</h4>
  {/if}

  <label>
    <input
      type="checkbox"
      onchange={handleToggleAll}
      checked={selectedAll}
      autocomplete="off"
    />
    <strong>Select All</strong></label>

  {#each labelList as label (label.id)}
    <label style:--local-color={label.color}>
      <div class="checkbox">
        <input
          type="checkbox"
          name="label"
          value={label.id}
          bind:group={selectedLabelIdList}
          autocomplete="off"
        />
      </div>
      {#if label.icon}<Emoji native={label.icon} scale={3} />{/if}
      <span>{label.name}</span>
      <a href="/label/edit/{label.id}">Edit</a>
    </label>
  {/each}
</section>

<style>
  .LabelList {
    background: var(--color-grey-50);
    padding: var(--size-4);
    border-radius: var(--radius-sm);

    display: flex;
    flex-direction: column;
    gap: var(--size-2);
  }

  label {
    border-radius: var(--radius-sm);
    background: color-mix(in lch, var(--local-color), transparent 80%);
    display: flex;
    gap: var(--size-2);
    align-items: center;
    height: var(--size-10);
  }

  .checkbox {
    width: var(--size-10);
    height: var(--size-10);
    background: var(--local-color);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

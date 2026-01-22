<script lang="ts">
import type { Placement } from '@floating-ui/dom'
import { flip, offset, shift } from '@floating-ui/dom'
import { Picker } from 'emoji-mart'
import type { Snippet } from 'svelte'

import { createFloatingAttachment } from '#lib/utils/attachments/float.svelte.js'
import { clickOutside } from '#lib/utils/attachments/outside.js'
import { initEmojiMart } from '#lib/utils/emoji.js'

type Emoji = {
  native: string
}

type ToggleEmojiPickerFn = (event: Event) => void

type Props = {
  isOpen?: boolean
  placement?: Placement
  button?: Snippet<[ToggleEmojiPickerFn]>
  onselect?: (emoji: string) => void
}

let {
  isOpen = $bindable(false),
  placement = 'right-start',
  button,
  onselect,
}: Props = $props()

let [anchor, floating] = $derived(
  createFloatingAttachment({
    placement,
    middleware: [offset(8), flip(), shift()],
  }),
)

let emojiRef: HTMLDivElement | undefined = $state(undefined)
let emojiPicker: Node | undefined = $state(undefined)

const hideEmojiPicker = () => {
  isOpen = false
  if (emojiRef && emojiPicker) {
    // eslint-disable-next-line svelte/no-dom-manipulating
    emojiRef.removeChild(emojiPicker)
  }
}

const showEmojiPicker = () => {
  isOpen = true
  initEmojiMart()
  requestAnimationFrame(() => {
    emojiPicker = new Picker({
      autoFocus: true,
      onEmojiSelect: (emoji: Emoji, event: Event) => {
        event.stopPropagation()
        event.preventDefault()
        onselect?.(emoji.native)
        hideEmojiPicker()
      },
    }) as unknown as Node
    // eslint-disable-next-line svelte/no-dom-manipulating
    emojiRef?.appendChild(emojiPicker)
  })
}

const toggleEmojiPicker: ToggleEmojiPickerFn = (event) => {
  event.stopPropagation()
  event.preventDefault()
  if (isOpen) {
    hideEmojiPicker()
  } else {
    showEmojiPicker()
  }
}
</script>

<div {@attach anchor}>
  {#if button}
    {@render button(toggleEmojiPicker)}
  {:else}
    <button type="button" onclick={toggleEmojiPicker}>
      Change Icon
    </button>
  {/if}
</div>

{#if isOpen}
  <div
    class="emojiMart"
    {@attach floating}
    {@attach clickOutside(hideEmojiPicker)}
    bind:this={emojiRef}></div>
{/if}

<style>
  .emojiMart {
    z-index: var(--layer-4);
  }
</style>

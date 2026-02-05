<script lang="ts">
import { onMount } from 'svelte'

import { initEmojiMart } from '#lib/utils/emoji.js'

type Props = {
  scale?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  native: string
  children?: never
}

const { scale = 1, native }: Props = $props()

let isReady = $state(false)

onMount(() => {
  initEmojiMart()
  isReady = true
})
</script>

{#if isReady}
  <em-emoji {native} style:font-size="var(--scale-{scale})"> </em-emoji>
{/if}

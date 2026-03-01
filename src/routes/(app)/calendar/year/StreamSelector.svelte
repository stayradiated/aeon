<script lang="ts">
import type { StreamId } from '#lib/ids.js'
import type { Stream } from '#lib/types.local.js'

type Props = {
  streamList: Stream[]
  selectedStreamId: StreamId | undefined
  onselect?: (streamId: StreamId) => void
}

const { streamList, selectedStreamId, onselect }: Props = $props()
</script>

<div class="StreamSelector">
  {#each streamList as stream (stream.id)}
    <button class:isSelected={stream.id === selectedStreamId} onclick={() => onselect?.(stream.id)}>{stream.name}</button>
  {/each}
</div>

<style>
  .StreamSelector {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: var(--size-2);
  }

  button {
    background: none;
    border: none;
    color: var(--color-grey-500);
    padding: var(--size-1) var(--size-2);

    &:hover {
      text-decoration: underline;
    }

    &.isSelected {
      color: var(--color-grey-50);
      background: var(--color-blue-300);
    }
  }
</style>

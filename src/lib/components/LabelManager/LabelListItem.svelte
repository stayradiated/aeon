<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Label } from '#lib/types.local.js'

import Emoji from '#lib/components/Emoji/Emoji.svelte'

type Props = {
  store: Store
  label: Label
  isSelected: boolean
  onchange?: (isSelected: boolean) => void
}

const { label }: Props = $props()
</script>

<div class="LabelListItem" style:--color={label.color}>
  <a href="/label/{label.id}" class="link">
    <div class="icon">
      {#if label.icon}
        <Emoji native={label.icon} scale={3} />
      {/if}
    </div>
    <div class="name">{label.name}</div>
  </a>
  <a class="editBtn" href="/label/edit/{label.id}">Edit</a>
</div>

<style>
  .LabelListItem {
    display: flex;
    gap: var(--size-2);
    max-width: 600px;
    align-items: center;
  }

  .link {
    flex: 1;
    display: flex;
    gap: var(--size-2);
    align-items: center;
    height: var(--size-10);
    text-decoration: none;
    padding-inline: var(--size-4);

    background: var(--color);
    color: contrast-color(var(--color));

    &:hover {
      text-decoration: underline;
    }
  }

  .icon {
    width: var(--size-8);
  }

  .editBtn {
    color: var(--color-grey-700);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
</style>

<script lang="ts" generics="Value extends string">
import { onMount } from 'svelte'

type Option = {
  value: Value
  label: string
}

type Props = {
  optionList: readonly Option[]
  selectedList: readonly Option[]
  placeholder?: string
  onchange?: (selectedList: Option[]) => void
  oncreate?: (label: string) => void
}

const { optionList, selectedList, placeholder, onchange, oncreate }: Props =
  $props()

let inputEl = $state<HTMLInputElement>()
let searchQuery = $state('')
let isOpen = $state(false)

const selectedSet = $derived(
  new Set(selectedList.map((option) => option.value)),
)

const filteredOptionList = $derived.by(() => {
  const searchQueryLC = searchQuery.trim().toLowerCase()
  return optionList.filter((option) => {
    if (selectedSet.has(option.value)) {
      return false
    }
    return searchQueryLC.length === 0
      ? true
      : option.label.toLowerCase().includes(searchQueryLC)
  })
})

onMount(() => {
  // auto-focus the input on mount
  inputEl?.focus()
})

const handleFocus = () => {
  isOpen = true
}

const handleBlur = () => {
  isOpen = false
}

const handleAdd = (option: Option) => {
  searchQuery = ''
  isOpen = false
  if (selectedSet.has(option.value)) {
    return
  }
  onchange?.([...selectedList, option])
  inputEl?.blur()
}

const handleCreate = () => {
  oncreate?.(searchQuery)
  searchQuery = ''
  isOpen = false
}

const handleKeyDown = (
  event: KeyboardEvent & { currentTarget: HTMLInputElement },
) => {
  switch (event.key) {
    case 'Backspace': {
      const value = event.currentTarget.value
      if (value.length === 0) {
        event.preventDefault()
        // remove last selected option
        const lastOption = selectedList.at(-1)
        if (lastOption) {
          handleRemove(lastOption)
        }
      }
      break
    }
    case 'Enter': {
      event.preventDefault()
      // select first available option
      const option = filteredOptionList[0]
      if (option) {
        handleAdd(option)
      } else if (searchQuery.length > 0) {
        handleCreate()
      }
    }
  }
}

const handleRemove = (option: Option) => {
  // we intentionally compare options by value
  // as references may not be the same between `optionList` and `selectedList`
  const index = selectedList.findIndex(
    (selectedOption) => selectedOption.value === option.value,
  )
  if (index === -1) {
    return
  }
  onchange?.(selectedList.toSpliced(index, 1))
}

const handleRemoveAll = () => {
  onchange?.([])
}
</script>

<div class="MultiSelect">
  <div class="selected">
    <div class="itemList">
      {#each selectedList as option (option.value)}
        <button type="button" onclick={() => handleRemove(option)}>
          {option.label}
        </button>
      {/each}
    </div>

    {#if selectedList.length > 0}
      <button type="button" onclick={handleRemoveAll}>Clear</button>
    {/if}
  </div>

  <input
    bind:this={inputEl}
    type="text"
    {placeholder}
    bind:value={searchQuery}
    onkeydown={handleKeyDown}
    onfocus={handleFocus}
    onblur={handleBlur}
  />

  {#if isOpen}
    <div class="dropdown">
      {#each filteredOptionList as option (option.value)}
        <button
          type="button"
          onmousedown={(event) => { event.stopImmediatePropagation(); event.preventDefault(); handleAdd(option) }}>{option.label}</button>
      {/each}
      {#if searchQuery.length > 0}
        <button
          type="button"
          onmousedown={(event) => { event.stopImmediatePropagation(); event.preventDefault(); handleCreate() }}>Create: {searchQuery}</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .MultiSelect {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
  }

  .selected {
    display: flex;
    justify-content: space-between;

    .itemList {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: var(--size-2);
    }
  }

  .dropdown {
    display: flex;
    flex-direction: column;

    max-height: var(--size-52);
    overflow-y: auto;
  }

  button {
    text-align: left;
    line-height: var(--line-lg);
  }
</style>

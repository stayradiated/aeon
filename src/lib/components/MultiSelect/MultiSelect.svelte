<script lang="ts" generics="Value extends string">
import type { Snippet } from 'svelte'
import { onMount } from 'svelte'

type Option = {
  value: Value
  icon: string | undefined
  name: string
}

type Props = {
  id?: string
  children?: Snippet
  isCreatable?: boolean
  autofocus?: boolean
  optionList: readonly Option[]
  selectedList: readonly Option[]
  placeholder?: string
  onchange?: (selectedList: Option[]) => void
  oncreate?: (label: string) => void
}

const {
  id,
  children,
  isCreatable = false,
  autofocus,
  optionList,
  selectedList,
  placeholder,
  onchange,
  oncreate,
}: Props = $props()

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
      : option.name.toLowerCase().includes(searchQueryLC)
  })
})

onMount(() => {
  if (autofocus) {
    // auto-focus the input on mount
    inputEl?.focus()
  }
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

        // ctrl+backspace removes all
        if (event.ctrlKey) {
          handleRemoveAll()
        } else {
          // remove last selected option
          const lastOption = selectedList.at(-1)
          if (lastOption) {
            handleRemove(lastOption)
          }
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
      } else if (isCreatable && searchQuery.length > 0) {
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
  isOpen = true
}

const handleRemoveAll = () => {
  onchange?.([])
  isOpen = true
}
</script>

<div class="MultiSelect">
  <div class="input-row">

    {#if selectedList.length > 0}
      <div class="selected">
        <div class="itemList">
          {#each selectedList as option (option.value)}
            <button
              type="button"
              onmousedown={(e) => e.preventDefault()}
              onclick={() => handleRemove(option)}>
              <span class="icon">{option.icon}</span>
              <span class="name">{option.name}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="input">
      <input
        {id}
        bind:this={inputEl}
        type="text"
        {placeholder}
        bind:value={searchQuery}
        onkeydown={handleKeyDown}
        onfocus={handleFocus}
        onblur={handleBlur}
      />
      {@render children?.()}
    </div>
  </div>

  {#if isOpen}
    <div class="dropdown">
      {#each filteredOptionList as option (option.value)}
        <button
          type="button"
          onmousedown={(event) => { event.stopImmediatePropagation(); event.preventDefault(); handleAdd(option) }}>
          <span class="icon">{option.icon}</span>
          <span class="name">{option.name}</span>
        </button>
      {/each}
      {#if isCreatable && searchQuery.length > 0}
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

  .input-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);

    button {
      line-height: var(--line-xl);
    }

    .input {
      flex: 1;
      display: flex;
      gap: var(--size-2);
    }

    input {
      flex: 1;
      line-height: var(--line-xl);
      height: var(--line-xl);
    }
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
    gap: var(--size-px);

    max-height: var(--size-52);
    overflow-y: auto;

    button {
      text-align: left;
      line-height: var(--line-xl);
      padding-left: var(--size-3);
      border-radius: none;
      border: none;
      background: var(--color-grey-100);
      display: flex;
      gap: var(--size-2);

      &:hover {
        background: var(--color-grey-50);
      }

      .icon {
        width: var(--size-6);
        text-align: center;
      }
    }
  }
</style>

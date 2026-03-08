<script lang="ts">
import type { ButtonRootProps } from './types.js'

let {
  href,
  type,
  children,
  disabled = false,
  ref = $bindable(null),
  ...restProps
}: ButtonRootProps = $props()
</script>

<svelte:element
  class="Button"
  this={href ? "a" : "button"}
  data-button-root
  type={href ? undefined : type}
  href={href && !disabled ? href : undefined}
  disabled={href ? undefined : disabled}
  aria-disabled={href ? disabled : undefined}
  role={href && disabled ? "link" : undefined}
  tabindex={href && disabled ? -1 : 0}
  bind:this={ref}
  {...restProps}>
  {@render children?.()}
</svelte:element>

<style>
  .Button {
    &:where(a) {
      /* anchor tag */
      display: inline-block;
      text-decoration: none;
      color: var(--theme-text-main);
      font-size: var(--scale-0);
    }
    &:where(button) {
      /* button tag*/
      background: none;
      border: none;
      color: var(--theme-text-main);
      appearance: none;
      padding: 0;
      font-size: var(--scale-0);
    }
  }
</style>

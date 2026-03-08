import type { Snippet } from 'svelte'
import type {
  HTMLAnchorAttributes,
  HTMLButtonAttributes,
} from 'svelte/elements'

type ButtonRootPropsWithoutHTML = {
  ref?: HTMLElement | null
  children?: Snippet
}

type AnchorElement = ButtonRootPropsWithoutHTML &
  Omit<HTMLAnchorAttributes, 'href' | 'type'> & {
    href: HTMLAnchorAttributes['href']
    type?: never
    disabled?: HTMLButtonAttributes['disabled']
  }

type ButtonElement = ButtonRootPropsWithoutHTML &
  Omit<HTMLButtonAttributes, 'type' | 'href'> & {
    type?: HTMLButtonAttributes['type']
    href?: never
    disabled?: HTMLButtonAttributes['disabled']
  }

type ButtonRootProps = AnchorElement | ButtonElement

export type { ButtonRootProps }

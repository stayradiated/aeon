import type { ComputePositionConfig } from '@floating-ui/dom'
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom'
import type { Attachment } from 'svelte/attachments'

const defaultConfig: ComputePositionConfig = {
  placement: 'bottom-start',
  strategy: 'absolute',
  middleware: [offset(4), flip(), shift()],
}

const createFloatingAttachment = (userConfig?: ComputePositionConfig) => {
  const config = { ...defaultConfig, ...userConfig }

  let referenceEl = $state<HTMLElement>()
  let floatingEl = $state<HTMLElement>()

  const attachReference: Attachment<HTMLElement> = (node) => {
    referenceEl = node

    return () => {
      referenceEl = undefined
    }
  }

  const attachFloating: Attachment<HTMLElement> = (node) => {
    floatingEl = node

    return () => {
      floatingEl = undefined
    }
  }

  $effect(() => {
    if (!referenceEl || !floatingEl) {
      return
    }

    const cleanup = autoUpdate(referenceEl, floatingEl, () => {
      if (!referenceEl || !floatingEl) {
        return
      }

      const { style } = floatingEl
      void computePosition(referenceEl, floatingEl, config).then(
        (v) => {
          style.position = v.strategy
          style.left = `${v.x}px`
          style.top = `${v.y}px`
        },
        (error) => {
          console.error('Error computing position for floating element:', error)
        },
      )
    })

    return () => {
      cleanup()
    }
  })

  return [attachReference, attachFloating] as const
}

export { createFloatingAttachment }

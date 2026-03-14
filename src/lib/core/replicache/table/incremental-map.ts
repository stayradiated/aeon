import type { AtomOptions, Signal } from 'signia'
import { computed, isUninitialized, RESET_VALUE } from 'signia'

import type { DiffList } from './diff.js'

import { browser as isBrowser, dev as isDev } from '$app/environment'

import { squashDiffListList } from './diff.js'

const incrementalMap = <InValue, OutValue>(
  source: Signal<Record<string, InValue>, DiffList<InValue>>,
  transform: (value: InValue) => OutValue,
  options?: AtomOptions<OutValue[], never>,
): Signal<OutValue[], never> => {
  let transformRecord: Record<string, OutValue> = {}

  const reset = (): OutValue[] => {
    transformRecord = {}
    for (const [key, value] of Object.entries(source.value)) {
      transformRecord[key] = transform(value)
    }
    return Object.values(transformRecord)
  }

  return computed(
    `${source.name}:map`,
    (prev, lastComputedEpoch) => {
      // is the first time we're running?
      if (isUninitialized(prev)) {
        return reset()
      }

      const diffListList = source.getDiffSince(lastComputedEpoch)
      if (diffListList === RESET_VALUE) {
        if (isBrowser && isDev) {
          console.warn(`[${source.name}::map] RESET_VALUE`)
        }
        return reset()
      }
      const diffList = squashDiffListList(diffListList)

      if (diffList.length === 0) {
        // no changes upstream
        // let's assume that the transform relies on a signal that has changed
        return reset()
      }

      for (const diff of diffList) {
        switch (diff.op) {
          case 'add': {
            transformRecord[diff.key] = transform(diff.value)
            break
          }
          case 'replace': {
            transformRecord[diff.key] = transform(diff.value)
            break
          }
          case 'remove': {
            delete transformRecord[diff.key]
            break
          }
          default: {
            diff satisfies never
            throw new Error(
              `Unhandled patch operation: ${JSON.stringify(diff)}`,
            )
          }
        }
      }

      return Object.values(transformRecord)
    },
    {
      ...options,
    },
  )
}

export { incrementalMap }

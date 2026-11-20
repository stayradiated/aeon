import type { AtomOptions, Signal } from 'signia'
import { computed, isUninitialized, RESET_VALUE } from 'signia'

import type { DiffList } from './diff.js'

import { browser as isBrowser, dev as isDev } from '$app/env'

import { squashDiffListList } from './diff.js'

const incrementalFilter = <Value>(
  source: Signal<Record<string, Value>, DiffList<Value>>,
  predicate: (value: Value) => boolean,
  options?: AtomOptions<Value[], never>,
): Signal<Value[], never> => {
  let matchRecord: Record<string, Value> = {}

  const reset = (): Value[] => {
    matchRecord = {}
    for (const [key, value] of Object.entries(source.value)) {
      if (predicate(value)) {
        matchRecord[key] = value
      }
    }
    return Object.values(matchRecord)
  }

  return computed(
    `${source.name}:filter`,
    (prev, lastComputedEpoch) => {
      if (isUninitialized(prev)) {
        return reset()
      }

      const diffListList = source.getDiffSince(lastComputedEpoch)
      if (diffListList === RESET_VALUE) {
        if (isBrowser && isDev) {
          console.warn(`[${source.name}::filter] RESET_VALUE`)
        }
        return reset()
      }
      const diffList = squashDiffListList(diffListList)

      if (diffList.length === 0) {
        // no changes upstream
        // let's assume that the predicate relies on a signal that has changed
        return reset()
      }

      for (const diff of diffList) {
        switch (diff.op) {
          case 'add': {
            const isMatch = predicate(diff.value)
            if (isMatch) {
              // added value is a match
              matchRecord[diff.key] = diff.value
            } else {
              // added value is not a match
              // → do nothing
            }
            break
          }
          case 'remove': {
            delete matchRecord[diff.key]
            break
          }
          case 'replace': {
            const isMatch = predicate(diff.value)
            if (isMatch) {
              matchRecord[diff.key] = diff.value
            } else {
              delete matchRecord[diff.key]
            }
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

      return Object.values(matchRecord)
    },
    {
      ...options,
    },
  )
}

export { incrementalFilter }

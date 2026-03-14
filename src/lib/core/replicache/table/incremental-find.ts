import type { AtomOptions, Signal } from 'signia'
import { computed, isUninitialized, RESET_VALUE } from 'signia'

import type { DiffList } from './diff.js'

import { browser as isBrowser, dev as isDev } from '$app/environment'

import { squashDiffListList } from './diff.js'

const incrementalFind = <Value>(
  source: Signal<Record<string, Value>, DiffList<Value>>,
  predicate: (value: Value) => boolean,
  options?: AtomOptions<Value | undefined, never>,
): Signal<Value | undefined, never> => {
  const dirtySet = new Set<string>()
  let lastFoundKey: string | undefined

  const reset = (): Value | undefined => {
    dirtySet.clear()
    lastFoundKey = undefined

    let isFound = false
    let returnValue: Value | undefined
    for (const [key, value] of Object.entries(source.value)) {
      if (isFound) {
        dirtySet.add(key)
      } else if (predicate(value)) {
        isFound = true
        returnValue = value
        lastFoundKey = key
      }
    }

    return returnValue
  }

  const continueSearch = (): Value | undefined => {
    for (const dirtyKey of dirtySet) {
      dirtySet.delete(dirtyKey)
      // biome-ignore lint/style/noNonNullAssertion: we know source.value[dirtyKey] is defined
      const value = source.value[dirtyKey]!
      if (predicate(value)) {
        lastFoundKey = dirtyKey
        return value
      }
    }
    // no more dirty keys
    lastFoundKey = undefined
    return undefined
  }

  return computed(
    `${source.name}:find`,
    (prev, lastComputedEpoch) => {
      if (isUninitialized(prev)) {
        return reset()
      }

      const diffListList = source.getDiffSince(lastComputedEpoch)
      if (diffListList === RESET_VALUE) {
        if (isBrowser && isDev) {
          console.warn(`[${source.name}::find] RESET_VALUE`)
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
            if (typeof lastFoundKey === 'undefined') {
              const isMatch = predicate(diff.value)
              if (isMatch) {
                lastFoundKey = diff.key
              }
            } else {
              dirtySet.add(diff.key)
            }
            break
          }
          case 'remove': {
            if (diff.key === lastFoundKey) {
              // the value at the current index is no longer a match
              continueSearch()
            } else {
              dirtySet.delete(diff.key)
            }
            break
          }
          case 'replace': {
            if (
              diff.key === lastFoundKey ||
              typeof lastFoundKey === 'undefined'
            ) {
              const isMatch = predicate(diff.value)
              if (isMatch) {
                lastFoundKey = diff.key
              } else {
                continueSearch()
              }
            } else {
              dirtySet.add(diff.key)
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

      return typeof lastFoundKey === 'undefined'
        ? undefined
        : source.value[lastFoundKey]
    },
    {
      ...options,
    },
  )
}

export { incrementalFind }

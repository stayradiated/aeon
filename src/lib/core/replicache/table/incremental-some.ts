import type { AtomOptions, Signal } from 'signia'
import { computed, isUninitialized, RESET_VALUE } from 'signia'

import type { DiffList } from './diff.js'

import { browser as isBrowser, dev as isDev } from '$app/environment'

import { squashDiffListList } from './diff.js'

const incrementalSome = <Value>(
  source: Signal<Record<string, Value>, DiffList<Value>>,
  predicate: (value: Value) => boolean,
  options?: AtomOptions<boolean, never>,
): Signal<boolean, never> => {
  const matchSet = new Set<string>()
  const dirtySet = new Set<string>()

  const reset = (): boolean => {
    matchSet.clear()
    dirtySet.clear()

    let isFound = false
    for (const [key, value] of Object.entries(source.value)) {
      if (isFound) {
        dirtySet.add(key)
      } else if (predicate(value)) {
        matchSet.add(key)
        isFound = true
      }
    }
    return isFound
  }

  const continueSearch = (): boolean => {
    for (const dirtyKey of dirtySet) {
      dirtySet.delete(dirtyKey)
      // biome-ignore lint/style/noNonNullAssertion: we know source.value[dirtyKey] is defined
      const value = source.value[dirtyKey]!
      if (predicate(value)) {
        matchSet.add(dirtyKey)
        return true
      }
    }
    return false
  }

  return computed(
    `${source.name}:some`,
    (prev, lastComputedEpoch) => {
      if (isUninitialized(prev)) {
        return reset()
      }

      const diffListList = source.getDiffSince(lastComputedEpoch)
      if (diffListList === RESET_VALUE) {
        if (isBrowser && isDev) {
          console.warn(`[${source.name}::some] RESET_VALUE`)
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
            if (matchSet.size === 0) {
              const isMatch = predicate(diff.value)
              if (isMatch) {
                matchSet.add(diff.key)
              }
            } else {
              dirtySet.add(diff.key)
            }
            break
          }

          case 'remove': {
            dirtySet.delete(diff.key)
            matchSet.delete(diff.key)
            if (matchSet.size === 0) {
              continueSearch()
            }
            break
          }

          case 'replace': {
            if (matchSet.has(diff.key) || matchSet.size === 0) {
              dirtySet.delete(diff.key)
              if (predicate(diff.value)) {
                matchSet.add(diff.key)
              } else {
                matchSet.delete(diff.key)
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

      return matchSet.size > 0
    },
    {
      ...options,
    },
  )
}

export { incrementalSome }

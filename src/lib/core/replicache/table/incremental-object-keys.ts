import type { AtomOptions, Signal } from 'signia'
import { computed, isUninitialized, RESET_VALUE } from 'signia'

import type { DiffList } from './diff.js'

import { browser as isBrowser, dev as isDev } from '$app/environment'

import { squashDiffListList } from './diff.js'

const incrementalObjectKeys = <Key, Value>(
  source: Signal<Record<string, Value>, DiffList<Value>>,
  mapKey: (key: string) => Key,
  options?: AtomOptions<Key[], never>,
): Signal<Key[], never> => {
  let keyRecord: Record<string, Key> = {}

  const reset = (): Key[] => {
    keyRecord = {}
    for (const key of Object.keys(source.value)) {
      const value = mapKey(key)
      keyRecord[key] = value
    }
    return Object.values(keyRecord)
  }

  return computed(
    `${source.name}:keys`,
    (prev, lastComputedEpoch) => {
      if (isUninitialized(prev)) {
        return reset()
      }

      const diffListList = source.getDiffSince(lastComputedEpoch)
      if (diffListList === RESET_VALUE) {
        if (isBrowser && isDev) {
          console.warn(`[${source.name}::keys] RESET_VALUE`)
        }
        return reset()
      }
      const diffList = squashDiffListList(diffListList)

      if (diffList.length === 0) {
        // no changes upstream
        // let's assume that the mapKey relies on a signal that has changed
        return reset()
      }

      for (const diff of diffList) {
        switch (diff.op) {
          case 'add': {
            keyRecord[diff.key] = mapKey(diff.key)
            break
          }

          case 'remove': {
            delete keyRecord[diff.key]
            break
          }

          case 'replace': {
            // For keys, we don't need to handle replace operations since
            // keys themselves don't change, only their values do
            if (!(diff.key in keyRecord)) {
              keyRecord[diff.key] = mapKey(diff.key)
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

      return Object.values(keyRecord)
    },
    {
      ...options,
    },
  )
}

export { incrementalObjectKeys }

import type { Signal } from 'signia'
import { computed } from 'signia'

import type { Store } from '#lib/core/replicache/store.js'

import { memoize } from '#lib/utils/memoize'

type WithStoreOptions<Args extends unknown[]> = {
  cacheKey: (args: Args) => string
}

type Selection<Value> = Signal<Value> | (() => Value)

const createSelector = <Args extends unknown[], Result>(
  debugName: string,
  fn: (store: Store, ...args: Args) => Selection<Result>,
  options: WithStoreOptions<Args> = {
    cacheKey: JSON.stringify,
  },
): ((store: Store, ...args: Args) => Signal<Result>) => {
  const { cacheKey } = options
  return memoize(
    (store, ...args) => {
      const result = fn(store, ...args)
      if (typeof result === 'function') {
        return computed(debugName, result)
      }
      return result
    },
    {
      debugName,
      cacheKey: ([store, ...args]) => `${store.id}|${cacheKey(args)}`,
    },
  )
}

export type { Selection }

export { createSelector }

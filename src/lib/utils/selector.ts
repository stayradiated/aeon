import type { Signal } from 'signia'

import type { Store } from '#lib/core/replicache/store.js'

import { memoize } from '#lib/utils/memoize'

type WithStoreOptions<Args extends unknown[]> = {
  cacheKey: (args: Args) => string
}

const createSelector = <Args extends unknown[], Result extends Signal<unknown>>(
  _debugName: string,
  fn: (store: Store, ...args: Args) => Result,
  options: WithStoreOptions<Args> = {
    cacheKey: JSON.stringify,
  },
) => {
  const { cacheKey } = options
  return memoize(fn, {
    cacheKey: ([store, ...args]) => `${store.id}|${cacheKey(args)}`,
  })
}

export { createSelector }

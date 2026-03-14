import type { AtomOptions, Signal } from 'signia'
import { computed } from 'signia'

import type { DiffList } from './diff.js'

const incrementalGet = <Value>(
  source: Signal<Record<string, Value>, DiffList<Value>>,
  selectedKey: string,
  options?: AtomOptions<Value | undefined, never>,
): Signal<Value | undefined, never> => {
  return computed(
    `${source.name}:get`,
    () => {
      return source.value[selectedKey]
    },
    {
      ...options,
    },
  )
}

export { incrementalGet }

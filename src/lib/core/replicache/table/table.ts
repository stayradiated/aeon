import type { ExperimentalNoIndexDiff as ReplicacheDiffList } from 'replicache'
import type { Atom, Signal } from 'signia'
import { atom } from 'signia'

import type { DiffList } from './diff.js'

import { memoize } from '#lib/utils/memoize.js'

import { applyReplicacheDiff } from './diff.js'
import { incrementalFilter } from './incremental-filter.js'
import { incrementalFind } from './incremental-find.js'
import { incrementalGet } from './incremental-get.js'
import { incrementalMap } from './incremental-map.js'
import { incrementalObjectKeys } from './incremental-object-keys.js'
import { incrementalObjectValues } from './incremental-object-values.js'
import { incrementalSome } from './incremental-some.js'

type TableKey<Output> = {
  readonly name: string
  trimPrefix: (serialized: string) => string
  prefix(): string
  decode: (serialized: string) => Output
  decodeWithoutPrefix: (serialized: string) => Output
}

type TableConstructorOptions<KeyOutput, AnonValue, Value> = {
  key: TableKey<KeyOutput>
  mapValue: (value: AnonValue, key: KeyOutput) => Value
}

class Table<
  KeyOutput extends string | readonly [string, string],
  AnonValue,
  Value,
> {
  readonly key: TableKey<KeyOutput>
  readonly mapValue: (value: AnonValue, key: KeyOutput) => Value

  readonly name: string
  readonly atom: Atom<Record<string, Value>, DiffList<Value>>

  readonly asRecord: Signal<Record<string, Value>, DiffList<Value>>
  readonly asList: Signal<Value[], never>
  readonly keys: Signal<KeyOutput[], never>

  constructor(options: TableConstructorOptions<KeyOutput, AnonValue, Value>) {
    this.key = options.key
    this.mapValue = options.mapValue

    this.name = `Table(${this.key.name})`

    this.atom = atom(this.name, {}, { historyLength: 1 })

    this.asRecord = this.atom

    // TODO: maybe rename this to `values` to match the Map API?
    this.asList = incrementalObjectValues(this.atom)
    this.keys = incrementalObjectKeys(this.atom, (key) =>
      this.key.decodeWithoutPrefix(key),
    )

    // memoize all the methods that take arguments
    this.get = memoize(this.get.bind(this), {
      cacheKey: ([key]) =>
        typeof key === 'string' ? key : `${key[0]}/${key[1]}`,
    })
    this.find = memoize(this.find.bind(this), {
      cacheKey: ([cacheKey]) => cacheKey,
    })
    this.filter = memoize(this.filter.bind(this), {
      cacheKey: ([cacheKey]) => cacheKey,
    })
    this.map = memoize(this.map.bind(this), {
      cacheKey: ([cacheKey]) => cacheKey,
    })
    this.some = memoize(this.some.bind(this), {
      cacheKey: ([cacheKey]) => cacheKey,
    })
  }

  get(key: KeyOutput) {
    let serializedKey: string
    if (typeof key === 'string') {
      serializedKey = key
    } else if (Array.isArray(key)) {
      serializedKey = `${key[0]}/${key[1]}`
    } else {
      console.error(`${this.name}.get: invalid key`, key)
      serializedKey = ''
    }
    return incrementalGet<Value>(this.atom, serializedKey)
  }

  find(_cacheKey: string, predicate: (value: Value) => boolean) {
    return incrementalFind<Value>(this.atom, predicate)
  }
  filter(_cacheKey: string, predicate: (value: Value) => boolean) {
    return incrementalFilter<Value>(this.atom, predicate)
  }
  map<Result>(_cacheKey: string, transform: (value: Value) => Result) {
    return incrementalMap<Value, Result>(this.atom, transform)
  }
  some(_cacheKey: string, predicate: (value: Value) => boolean) {
    return incrementalSome<Value>(this.atom, predicate)
  }

  pushDiffList(diffList: ReplicacheDiffList) {
    applyReplicacheDiff<AnonValue, Value>({
      diffList,
      source: this.atom,
      mapKey: (key) => this.key.trimPrefix(key),
      mapValue: (value, key) => this.mapValue(value, this.key.decode(key)),
    })
  }
}

export { Table }

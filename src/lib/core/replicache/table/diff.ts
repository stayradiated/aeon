import type { ExperimentalNoIndexDiff as ReplicacheDiffList } from 'replicache'
import type { Atom } from 'signia'

type Diff<Value> =
  | {
      op: 'add'
      key: string
      value: Value
    }
  | {
      op: 'remove'
      key: string
    }
  | {
      op: 'replace'
      key: string
      value: Value
    }

type DiffList<Value> = Diff<Value>[]

type ApplyReplicacheDiffOptions<InValue, OutValue> = {
  diffList: ReplicacheDiffList
  source: Atom<Record<string, OutValue>, DiffList<OutValue>>
  mapKey: (key: string) => string
  mapValue: (value: InValue, key: string) => OutValue
}

const applyReplicacheDiff = <InValue, OutValue>(
  options: ApplyReplicacheDiffOptions<InValue, OutValue>,
): void => {
  const { diffList, source, mapKey, mapValue } = options

  if (diffList.length === 0) {
    // nothing to do
    return
  }

  const prev = source.__unsafe__getWithoutCapture()
  const nextValue = { ...prev }
  const nextDiffList: DiffList<OutValue> = []

  for (const diff of diffList) {
    switch (diff.op) {
      case 'add': {
        const key = mapKey(diff.key)
        const value = mapValue(diff.newValue as InValue, diff.key)
        nextValue[key] = value
        nextDiffList.push({ op: 'add', key, value })
        break
      }
      case 'change': {
        const key = mapKey(diff.key)
        const value = mapValue(diff.newValue as InValue, diff.key)
        nextValue[key] = value
        nextDiffList.push({ op: 'replace', key, value })
        break
      }
      case 'del': {
        const key = mapKey(diff.key)
        delete nextValue[key]
        nextDiffList.push({ op: 'remove', key })
        break
      }
      default: {
        diff satisfies never
        throw new Error(`Unhandled diff op: ${JSON.stringify(diff)}`)
      }
    }
  }

  source.set(nextValue, nextDiffList)
}

const squashDiffListList = <T>(diffListList: DiffList<T>[]): DiffList<T> => {
  const seenKeys = new Set<string>()
  const squashedDiffList: DiffList<T> = []

  for (let i = diffListList.length - 1; i >= 0; i--) {
    // biome-ignore lint/style/noNonNullAssertion: this is fine
    const diffList = diffListList[i]!
    for (let j = diffList.length - 1; j >= 0; j--) {
      // biome-ignore lint/style/noNonNullAssertion: this is fine
      const diff = diffList[j]!
      if (seenKeys.has(diff.key)) {
        continue
      }
      seenKeys.add(diff.key)
      squashedDiffList.push(diff)
    }
  }

  squashedDiffList.reverse()
  return squashedDiffList
}

export { applyReplicacheDiff, squashDiffListList }
export type { Diff, DiffList }

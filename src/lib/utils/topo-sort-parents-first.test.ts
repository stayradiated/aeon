import { test } from 'vitest'

import { topoSortParentsFirst } from './topo-sort-parents-first.js'

type Item = {
  id: string
  parents: string[]
  name?: string
}

const run = (items: readonly Item[]) =>
  topoSortParentsFirst({
    items,
    getId: (x) => x.id,
    getParentIdList: (x) => x.parents,
  })

const isError = (x: unknown): x is Error => x instanceof Error

const ids = (x: Item[] | Error) => (isError(x) ? x : x.map((i) => i.id))

const assertParentsBeforeChildren = (sorted: Item[]) => {
  const index: Record<string, number> = {}
  for (let i = 0; i < sorted.length; i += 1) {
    index[sorted[i]!.id] = i
  }

  for (const item of sorted) {
    for (const p of item.parents) {
      if (index[p] === undefined) {
        throw new Error(`Test setup error: parent ${p} not in sorted list`)
      }
      if (!(index[p] < index[item.id]!)) {
        throw new Error(`Expected parent ${p} before child ${item.id}`)
      }
    }
  }
}

test('returns items in the same order when there are no parents', ({
  expect,
}) => {
  const items: Item[] = [
    { id: 'a', parents: [] },
    { id: 'b', parents: [] },
    { id: 'c', parents: [] },
  ]

  const out = run(items)
  expect(out).not.toBeInstanceOf(Error)
  expect(ids(out)).toEqual(['a', 'b', 'c'])
})

test('sorts a simple chain: a -> b -> c (parent first)', ({ expect }) => {
  const items: Item[] = [
    { id: 'c', parents: ['b'] },
    { id: 'b', parents: ['a'] },
    { id: 'a', parents: [] },
  ]

  const out = run(items)
  expect(out).not.toBeInstanceOf(Error)
  expect(ids(out)).toEqual(['a', 'b', 'c'])
})

test('sorts a branching tree (parent first for all edges)', ({ expect }) => {
  // a is parent of b and c; c is parent of d
  const items: Item[] = [
    { id: 'd', parents: ['c'] },
    { id: 'c', parents: ['a'] },
    { id: 'b', parents: ['a'] },
    { id: 'a', parents: [] },
  ]

  const out = run(items)
  expect(out).not.toBeInstanceOf(Error)

  const sorted = out as Item[]
  expect(sorted).toHaveLength(items.length)
  assertParentsBeforeChildren(sorted)

  // optional: sanity check root is first here (not required by topo sort generally,
  // but given the inputs it should be)
  expect(sorted[0]!.id).toBe('a')
})

test('supports multiple parents per item', ({ expect }) => {
  // a and b are both parents of c
  const items: Item[] = [
    { id: 'c', parents: ['a', 'b'] },
    { id: 'b', parents: [] },
    { id: 'a', parents: [] },
  ]

  const out = run(items)
  expect(out).not.toBeInstanceOf(Error)

  const sorted = out as Item[]
  assertParentsBeforeChildren(sorted)
  expect(sorted.at(-1)?.id).toBe('c')
})

test('keeps relative order among independent roots (stable-ish with this implementation)', ({
  expect,
}) => {
  // Implementation detail: queue is seeded in input order, so independent nodes keep order.
  const items: Item[] = [
    { id: 'root1', parents: [] },
    { id: 'root2', parents: [] },
    { id: 'child', parents: ['root1'] },
  ]

  const out = run(items)
  expect(out).not.toBeInstanceOf(Error)
  expect(ids(out)).toEqual(['root1', 'root2', 'child'])
})

test('returns Error for duplicate IDs', ({ expect }) => {
  const items: Item[] = [
    { id: 'a', parents: [] },
    { id: 'a', parents: [] },
  ]

  const out = run(items)
  expect(out).toBeInstanceOf(Error)
  expect((out as Error).message).toMatch(/Duplicate ID: a/)
})

test('returns Error for missing parent', ({ expect }) => {
  const items: Item[] = [{ id: 'child', parents: ['missing'] }]

  const out = run(items)
  expect(out).toBeInstanceOf(Error)
  expect((out as Error).message).toMatch(/Missing parent: missing/)
})

test('returns Error for a simple cycle (a <-> b)', ({ expect }) => {
  const items: Item[] = [
    { id: 'a', parents: ['b'] },
    { id: 'b', parents: ['a'] },
  ]

  const out = run(items)
  expect(out).toBeInstanceOf(Error)
  expect((out as Error).message).toBe('Cycle detected')
})

test('returns Error for a longer cycle (a -> b -> c -> a)', ({ expect }) => {
  const items: Item[] = [
    { id: 'a', parents: ['c'] },
    { id: 'b', parents: ['a'] },
    { id: 'c', parents: ['b'] },
  ]

  const out = run(items)
  expect(out).toBeInstanceOf(Error)
  expect((out as Error).message).toBe('Cycle detected')
})

test('handles a mix: one acyclic component plus one cycle (should error)', ({
  expect,
}) => {
  const items: Item[] = [
    // acyclic piece
    { id: 'root', parents: [] },
    { id: 'leaf', parents: ['root'] },

    // cyclic piece
    { id: 'x', parents: ['y'] },
    { id: 'y', parents: ['x'] },
  ]

  const out = run(items)
  expect(out).toBeInstanceOf(Error)
  expect((out as Error).message).toBe('Cycle detected')
})

test('does not mutate the input items array or item objects', ({ expect }) => {
  const items: Item[] = [
    { id: 'b', parents: ['a'], name: 'B' },
    { id: 'a', parents: [], name: 'A' },
  ]

  const snapshot = structuredClone(items)
  const out = run(items)

  expect(out).not.toBeInstanceOf(Error)
  expect(items).toEqual(snapshot)
})

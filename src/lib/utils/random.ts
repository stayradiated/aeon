// RNG = Random Number Generator
type RNG = IterableIterator<number>

function* createRNG(seed: number): RNG {
  let value = seed
  while (true) {
    // https://github.com/cprosche/mulberry32
    value = (value + 0x6d2b79f5) | 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    yield ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const integer = (rng: RNG, min = 0, max = 100): number => {
  if (min > max) {
    throw new Error(`integer(rng, ${min}, ${max}) is invalid: min > max`)
  }
  return Math.floor(rng.next().value * (max - min + 1)) + min
}

const _float = (rng: RNG, min = 0, max = 1): number => {
  return rng.next().value * (max - min) + min
}

const arrayElement = <T>(rng: RNG, arr: T[]): T => {
  if (arr.length === 0) {
    throw new Error('arrayElement() called with empty array')
  }

  // biome-ignore lint/style/noNonNullAssertion: safe to do here
  return arr[integer(rng, 0, arr.length - 1)]!
}

const arrayElements = <T>(rng: RNG, arr: T[], count: number): T[] => {
  if (count === 0) {
    return []
  }
  if (count > arr.length) {
    throw new Error(
      `arrayElements() called with count (${count}) greater than array length (${arr.length})`,
    )
  }

  // For small counts relative to array size, use rejection sampling
  if (count <= arr.length / 2) {
    const selected = new Set<number>()
    const result: T[] = []

    while (result.length < count) {
      const index = integer(rng, 0, arr.length - 1)
      if (!selected.has(index)) {
        selected.add(index)
        // biome-ignore lint/style/noNonNullAssertion: safe to do here
        result.push(arr[index]!)
      }
    }

    return result
  }

  // For larger counts, use Fisher-Yates shuffle on a copy
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = integer(rng, 0, i)
    // biome-ignore lint/style/noNonNullAssertion: safe to do here
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }

  return shuffled.slice(0, count)
}

export { createRNG, integer, arrayElement, arrayElements }
export type { RNG }

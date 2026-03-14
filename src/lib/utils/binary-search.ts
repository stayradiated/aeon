// A total-order comparator: <0 if item < target, 0 if equal, >0 if item > target
export type Comparator<K> = (item: K) => number

export type Predicate<K> = (item: K) => boolean

/**
 * Returns the smallest index i in [0, n] such that pred(list[i]) is true.
 * Assumes pred is monotone: false...false, true...true.
 * If pred is never true, returns n.
 */
const firstTrue = <K>(list: readonly K[], pred: Predicate<K>): number => {
  let lo = 0
  let hi = list.length // exclusive

  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1)
    // biome-ignore lint/style/noNonNullAssertion: mid is in-bounds when lo < hi
    if (pred(list[mid]!)) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }

  return lo
}

/**
 * How to use lowerBound / upperBound on a sorted array:
 *
 * Given a sorted list and a comparator `compare(item)` that returns:
 *   < 0 if item < target, 0 if item == target, > 0 if item > target
 *
 * - `lowerBound(list, compare)` returns the first index with item >= target.
 * - `upperBound(list, compare)` returns the first index with item >  target.
 *
 * This gives you:
 *   - Insert position for `target` (stable, before equals): lowerBound(...)
 *   - Range of all occurrences of `target`: [lower, upper)
 *       const lower = lowerBound(list, cmp)
 *       const upper = upperBound(list, cmp)
 *       // target exists iff lower < upper (and list[lower] == target)
 *       // count = upper - lower
 *
 * Writing `compare` in practice: close over the target and compare the list
 * item to it:
 *
 * - numbers: `x => x - target`
 * - strings: `s => s.localeCompare(target)`
 * - objects: `o => o.key - targetKey`
 */

/**
 * lowerBound: first index with item >= target
 * i.e. first index where compare(item) >= 0
 */
const lowerBound = <K>(list: readonly K[], compare: Comparator<K>): number =>
  firstTrue(list, (item) => compare(item) >= 0)

/**
 * upperBound: first index with item > target
 * i.e. first index where compare(item) > 0
 */
const upperBound = <K>(list: readonly K[], compare: Comparator<K>): number =>
  firstTrue(list, (item) => compare(item) > 0)

export { lowerBound, upperBound }

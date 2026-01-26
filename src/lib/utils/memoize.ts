/*

Simplified fork of `memoize`

https://github.com/sindresorhus/memoize

Changes:
- Removed the `maxAge` option
- Removed dependency on `mimic-function`
- Removed `memoizeClear` and `memoizeDecorator` functions
- Removed support for prototype methods
- Stores value directly in the cache instead of wrapping it in an object

================================================================================

MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

================================================================================
*/

// biome-ignore lint/suspicious/noExplicitAny: required for generic function parameter constraints
type AnyFunction = (...arguments_: readonly any[]) => unknown

type MemoizeOptions<FunctionToMemoize extends AnyFunction> = {
  readonly cacheKey: (arguments_: Parameters<FunctionToMemoize>) => string
  readonly cache?: Record<string, ReturnType<FunctionToMemoize>>
}

const memoize = <FunctionToMemoize extends AnyFunction>(
  fn: FunctionToMemoize,
  { cacheKey, cache = {} }: MemoizeOptions<FunctionToMemoize>,
): FunctionToMemoize => {
  const memoized = ((
    ...args: Parameters<FunctionToMemoize>
  ): ReturnType<FunctionToMemoize> => {
    const key = cacheKey(args)
    if (key in cache) {
      const cached = cache[key]
      if (cached === undefined) {
        throw new Error('Cache corruption: key exists but value is undefined')
      }
      return cached
    }
    const result = fn(...args) as ReturnType<FunctionToMemoize>
    cache[key] = result
    return result
  }) as FunctionToMemoize

  // Preserve the original function's name
  Object.defineProperty(memoized, 'name', { value: fn.name })
  return memoized
}

export { memoize }
export type { MemoizeOptions }

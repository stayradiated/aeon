type AsyncIterableWithPeek<TValue, TReturn, TNext> = AsyncIterator<
  TValue,
  TReturn,
  TNext
> & {
  peek(): Promise<TValue | undefined>
}

const withPeek = <TValue, TReturn, TNext>(
  iterable: AsyncIterator<TValue, TReturn, TNext>,
): AsyncIterableWithPeek<TValue, TReturn, TNext> => {
  let peekedValue: TValue | undefined

  const peek = async (): Promise<TValue | undefined> => {
    if (peekedValue) {
      return peekedValue
    }
    const { value, done } = await iterable.next()
    if (done) {
      return undefined
    }
    peekedValue = value
    return value
  }

  return {
    peek,
    async next() {
      if (peekedValue) {
        const nextValue = peekedValue
        peekedValue = undefined
        return { done: undefined, value: nextValue }
      }
      return iterable.next()
    },
  }
}

export { withPeek }

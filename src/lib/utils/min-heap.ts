class MinHeap<T> {
  readonly data: T[] = []
  readonly isLess: (a: T, b: T) => boolean

  constructor(
    // should return true if a < b
    // false if a >= b
    isLess: (a: T, b: T) => boolean,
  ) {
    this.isLess = isLess
  }

  get size(): number {
    return this.data.length
  }

  get peek(): T | undefined {
    return this.data[0]
  }

  pop(): T | undefined {
    if (this.data.length === 0) {
      return undefined
    }
    const top = this.data[0]
    const last = this.data.pop()
    if (typeof last === 'undefined') {
      throw new Error(`Undefined value at index ${this.data.length}`)
    }

    if (this.data.length > 0) {
      this.data[0] = last
      this.bubbleDown()
    }
    return top
  }

  push(item: T): void {
    this.data.push(item)
    this.bubbleUp()
  }

  private bubbleUp(): void {
    let index = this.data.length - 1
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)

      const value = this.data[index]
      if (typeof value === 'undefined') {
        throw new Error(`Undefined value at index ${index}`)
      }

      const parentValue = this.data[parentIndex]
      if (typeof parentValue === 'undefined') {
        throw new Error(`Undefined value at index ${parentIndex}`)
      }

      if (!this.isLess(value, parentValue)) {
        break
      }
      // swap nodes
      ;[this.data[index], this.data[parentIndex]] = [parentValue, value]

      // move up to parent
      index = parentIndex
    }
  }

  private bubbleDown(): void {
    let index = 0
    const length = this.data.length
    while (true) {
      const leftIndex = index * 2 + 1
      const rightIndex = leftIndex + 1
      let minIndex = index

      let minValue = this.data[minIndex]
      if (typeof minValue === 'undefined') {
        throw new Error(`Undefined value at index ${minIndex}`)
      }

      if (leftIndex < length) {
        const leftValue = this.data[leftIndex]
        if (typeof leftValue === 'undefined') {
          throw new Error(`Undefined value at index ${leftIndex}`)
        }
        if (this.isLess(leftValue, minValue)) {
          minIndex = leftIndex
          minValue = leftValue
        }
      }

      if (rightIndex < length) {
        const rightValue = this.data[rightIndex]
        if (typeof rightValue === 'undefined') {
          throw new Error(`Undefined value at index ${rightIndex}`)
        }
        if (this.isLess(rightValue, minValue)) {
          minIndex = rightIndex
          minValue = rightValue
        }
      }

      if (minIndex === index) {
        break
      }

      const value = this.data[index]
      if (typeof value === 'undefined') {
        throw new Error(`Undefined value at index ${index}`)
      }

      ;[this.data[index], this.data[minIndex]] = [minValue, value]
      index = minIndex
    }
  }
}

export { MinHeap }

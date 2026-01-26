import type { Signal } from 'signia'
import { computed } from 'signia'

import type { Slice } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'

import { MinHeap } from '#lib/utils/min-heap.js'
import { objectEntries } from '#lib/utils/object-entries.js'
import { createSelector } from '#lib/utils/selector.js'

import { getAllLineLists } from './get-all-line-lists.js'

type HeapEntry = {
  streamId: StreamId
  index: number
  startedAt: number
}

const getSliceList = createSelector(
  'getSliceList',
  (
    store,
    where: {
      startedAt: { gte: number; lte?: number }
    },
  ): Signal<Slice[]> => {
    const $lineListRecord = getAllLineLists(store, where)

    return computed('getLineListForStream', () => {
      const lineListRecord = $lineListRecord.value

      const heap = new MinHeap<HeapEntry>((x, y) => x.startedAt < y.startedAt)

      // initialize heap with the first element of each stream
      for (const [streamId, list] of objectEntries(lineListRecord)) {
        const firstLine = list[0]
        if (firstLine) {
          heap.push({ streamId, index: 0, startedAt: firstLine.startedAt })
        }
      }

      const slices: Slice[] = []

      while (heap.size > 0) {
        const first = heap.pop()
        if (typeof first === 'undefined') {
          throw new Error('No first element in heap')
        }

        const startedAt = first.startedAt

        const slice: Slice = {
          startedAt,
          lineList: [],
        }

        const consume = (entry: HeapEntry) => {
          const lineList = lineListRecord[entry.streamId]
          if (typeof lineList === 'undefined') {
            throw new Error(`No line list for stream ${entry.streamId}`)
          }

          // add the current line
          const currentLine = lineList[entry.index]
          if (typeof currentLine === 'undefined') {
            throw new Error(
              `No line at index ${entry.index} for stream ${entry.streamId}`,
            )
          }
          slice.lineList.push(currentLine)

          // advance within the same stream
          const nextLineIndex = entry.index + 1
          const nextLine = lineList[nextLineIndex]

          // push next entry for that stream (if any)
          if (typeof nextLine !== 'undefined') {
            heap.push({
              streamId: entry.streamId,
              index: nextLineIndex,
              startedAt: nextLine.startedAt,
            })
          }
        }

        // consume the first popped entry
        consume(first)

        // consume any other entries that have the same time
        while (heap.peek?.startedAt === startedAt) {
          const entry = heap.pop()
          if (typeof entry === 'undefined') {
            throw new Error('No entry popped from heap')
          }
          consume(entry)
        }

        // emit slice
        slices.push(slice)
      }

      return slices
    })
  },
)

export { getSliceList }

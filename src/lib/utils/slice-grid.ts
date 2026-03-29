import type { Line } from '#lib/core/shape/types.js'
import type { StreamId } from '#lib/ids.js'

import { MinHeap } from '#lib/utils/min-heap.js'

type Cell = Line

type Row = {
  startedAt: number
  stoppedAt: number | undefined
  durationMs: number | undefined
  cellList: Array<undefined | Cell>
}

type SliceGrid = {
  startedAt: number
  stoppedAt: number
  rowList: Row[]
}

type BuildSliceGridOptions = {
  startedAt: number
  stoppedAt: number
  lineListRecord: Record<StreamId, Line[]>
  streamIdList: StreamId[]
}

type HeapEntry = {
  streamId: StreamId
  index: number
  startedAt: number
}

type ConsumeOptions = {
  lineListRecord: Record<StreamId, Line[]>
  streamIdList: StreamId[]
  entry: HeapEntry
  row: Row
  heap: MinHeap<HeapEntry>
}

const consume = (options: ConsumeOptions) => {
  const { lineListRecord, streamIdList, entry, row, heap } = options

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

  // get cell index of stream
  const index = streamIdList.indexOf(currentLine.streamId)
  if (index < -1) {
    throw new Error('wat')
  }

  // check if there is already a streamId in the slice
  const existingCell = row.cellList[index]
  if (typeof existingCell === 'undefined') {
    row.cellList[index] = currentLine
  } else {
    console.warn(`Duplicate streamId ${currentLine.streamId} detected`)
  }

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

const buildSliceGrid = (options: BuildSliceGridOptions): SliceGrid => {
  const { lineListRecord, streamIdList } = options

  const heap = new MinHeap<HeapEntry>((x, y) => x.startedAt < y.startedAt)

  // initialize heap with the first element of each stream
  for (const streamId of streamIdList) {
    const list = lineListRecord[streamId] ?? []
    const firstLine = list[0]
    if (firstLine) {
      heap.push({ streamId, index: 0, startedAt: firstLine.startedAt })
    }
  }

  const grid: SliceGrid = {
    startedAt: options.startedAt,
    stoppedAt: options.stoppedAt,
    rowList: [],
  }

  let prevRow: Row | undefined

  while (heap.size > 0) {
    const first = heap.pop()
    if (typeof first === 'undefined') {
      throw new Error('No first element in heap')
    }

    const startedAt = first.startedAt

    if (prevRow) {
      prevRow.stoppedAt = startedAt
      prevRow.durationMs = startedAt - prevRow.startedAt
    }

    const row: Row = {
      startedAt,
      stoppedAt: undefined,
      durationMs: undefined,
      cellList: streamIdList.map(() => undefined),
    }

    // consume the first popped entry
    consume({ lineListRecord, streamIdList, row, heap, entry: first })

    // consume any other entries that have the same time
    while (heap.peek?.startedAt === startedAt) {
      const entry = heap.pop()
      if (typeof entry === 'undefined') {
        throw new Error('No entry popped from heap')
      }
      consume({ lineListRecord, streamIdList, row, heap, entry })
    }

    // extend in any empty cells in the row
    if (prevRow) {
      for (let i = 0; i < streamIdList.length; i += 1) {
        const cell = row.cellList[i]
        const prevCell = prevRow.cellList[i]
        if (
          typeof cell === 'undefined' &&
          typeof prevCell !== 'undefined' &&
          (typeof prevCell.stoppedAt === 'undefined' ||
            prevCell.stoppedAt > startedAt)
        ) {
          row.cellList[i] = prevCell
        }
      }
    }

    // emit slice
    grid.rowList.push(row)
    prevRow = row
  }

  return grid
}

export type { SliceGrid }

export { buildSliceGrid }

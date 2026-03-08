import type { CalendarDate } from '#lib/utils/calendar-date.js'
import type { CalendarSpan } from '#lib/utils/calendar-span.js'

import * as calDateFns from '#lib/utils/calendar-date.js'

type Grid = {
  width: number
  startDate: CalendarDate
  endDate: CalendarDate
  offset: number
  rows: Row[]
}

type Row = {
  startDate: CalendarDate
  endDate: CalendarDate
  cells: Array<undefined | Cell>
  trackCount: number
}

type Cell = {
  date: CalendarDate
  tracks: Array<undefined | Track>
  durationMs: number
}

type Track = {
  spans: CalendarSpan[]
}

type Coords = {
  rowIndex: number
  cellIndex: number
}

const getCoords = (grid: Grid, date: CalendarDate): Coords => {
  const index = date - grid.startDate + grid.offset
  const rowIndex = Math.floor(index / grid.width)
  const cellIndex = index % grid.width
  return { rowIndex, cellIndex }
}

type BuildGridOptions = {
  startDate: CalendarDate
  endDate: CalendarDate

  width: number
}

const buildGrid = (options: BuildGridOptions): Grid => {
  const { startDate, endDate, width } = options

  // offset the grid so that the first day of the week is Monday
  const offset = (calDateFns.dayOfWeek(startDate) + 6) % 7

  const grid: Grid = {
    width,
    offset,
    startDate,
    endDate,
    rows: [],
  }

  const firstRow: Row = {
    cells: [],
    trackCount: 0,
    startDate: startDate,
    endDate: startDate,
  }
  grid.rows.push(firstRow)
  for (let i = 0; i < offset; i++) {
    firstRow.cells.push(undefined)
  }

  const dateList = calDateFns.eachDayOfInterval({
    start: startDate,
    end: endDate,
  })
  for (const date of dateList) {
    const { rowIndex, cellIndex } = getCoords(grid, date)

    grid.rows[rowIndex] ??= {
      cells: [],
      trackCount: 0,
      startDate: date,
      endDate: date,
    }
    const row = grid.rows[rowIndex]

    row.endDate = date
    row.cells[cellIndex] = {
      date,
      tracks: [],
      durationMs: 0,
    }
  }

  // ensure the last row is filled with blank cells
  const lastRow = grid.rows.at(-1)
  if (lastRow) {
    const blankCellCount = grid.width - lastRow.cells.length
    for (let i = 0; i < blankCellCount; i++) {
      lastRow.cells.push(undefined)
    }
  }

  return grid
}

const pushCalendarSpanForRow = (
  grid: Grid,
  rowIndex: number,
  calendarSpan: CalendarSpan,
): void => {
  const row = grid.rows[rowIndex]
  if (!row) {
    return
  }

  const startDate = Math.max(row.startDate, calendarSpan[0]) as CalendarDate
  const endDate = Math.min(row.endDate, calendarSpan[1]) as CalendarDate

  const dateList = calDateFns.eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  // find the smallest available track index
  // that has availability for all the dates
  let trackIndex = 0
  trackIndexLoop: while (true) {
    for (const date of dateList) {
      const { cellIndex } = getCoords(grid, date)
      const cell = grid.rows[rowIndex]?.cells[cellIndex]
      if (!cell) {
        continue
      }

      const track = cell.tracks[trackIndex]
      if (track) {
        trackIndex += 1
        continue trackIndexLoop
      }
    }
    break
  }

  for (const date of dateList) {
    const { rowIndex, cellIndex } = getCoords(grid, date)

    const row = grid.rows[rowIndex]
    if (!row) {
      continue
    }

    const cell = row.cells[cellIndex]
    if (!cell) {
      continue
    }

    cell.tracks[trackIndex] = { spans: [calendarSpan] }
    row.trackCount = Math.max(row.trackCount, trackIndex + 1)
  }

  // remove any sparse values from the track list
  for (const cell of row.cells) {
    if (!cell) {
      continue
    }
    for (let i = 0; i < row.trackCount; i++) {
      const track = cell.tracks[i]
      if (!track) {
        cell.tracks[i] = undefined
      }
    }
  }
}

const pushCalendarSpan = (grid: Grid, calendarSpan: CalendarSpan): void => {
  const [startDate, endDate] = calendarSpan

  const { rowIndex: startRowIndex } = getCoords(grid, startDate)
  const { rowIndex: endRowIndex } = getCoords(grid, endDate)

  for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
    pushCalendarSpanForRow(grid, rowIndex, calendarSpan)
  }
}

const renderGrid = (grid: Grid): string => {
  const rowList = grid.rows.map((row) => {
    return Array.from({ length: row.trackCount + 1 })
      .map((_, index) => {
        const trackIndex = index - 1

        const cellList = row.cells
          .map((cell) => {
            if (!cell) {
              return ' '.repeat(10)
            }

            if (trackIndex === -1) {
              const date = cell.date
              const day = calDateFns.format(date, 'd MMM')
              return day.padStart(10, ' ')
            }
            const track = cell.tracks[trackIndex]
            if (!track) {
              return ' '.repeat(10)
            }

            return track.spans
              .map((span) => {
                const [startDate, endDate, labelId] = span
                const isStart = startDate === cell.date
                const isEnd = endDate === cell.date

                const bStart = '[--'
                const bEnd = '--]'
                const bMid = '---'

                const prefix = isStart ? bStart : bMid
                const suffix = isEnd ? bEnd : bMid

                return `${prefix} ${labelId} ${suffix}`
              })
              .join(' / ')
              .padStart(10, ' ')
          })
          .join(' | ')
        return `| ${cellList} |`
      })
      .join('\n')
  })

  const border = `+${Array(grid.width).fill('-'.repeat(12)).join('+')}+`

  return `\n${border}\n${rowList.join(`\n${border}\n`)}\n${border}\n`
}

export { getCoords, buildGrid, renderGrid, pushCalendarSpan }
export type { Grid, Row, Cell, Track }

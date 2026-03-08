import { describe, expect, test } from 'vitest'

import type { LabelId } from '#lib/ids.js'
import type { CalendarSpan } from '#lib/utils/calendar-span.js'

import { fromUTC } from '#lib/utils/calendar-date.js'

import { buildGrid, pushCalendarSpan, renderGrid } from './calendar-grid.js'

const LABEL_A = 'a' as LabelId
const LABEL_B = 'b' as LabelId
const LABEL_C = 'c' as LabelId
const LABEL_D = 'd' as LabelId
const LABEL_E = 'e' as LabelId
const LABEL_F = 'f' as LabelId

describe('buildGrid', () => {
  test('one row showing a single week', () => {
    // note: that 2024 is a good year to test this
    // with this as it starts on a Monday

    const grid = buildGrid({
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 7),
      width: 7,
    })

    expect(renderGrid(grid)).toMatchInlineSnapshot(`
      "
      +------------+------------+------------+------------+------------+------------+------------+
      |      1 Jan |      2 Jan |      3 Jan |      4 Jan |      5 Jan |      6 Jan |      7 Jan |
      +------------+------------+------------+------------+------------+------------+------------+
      "
    `)

    expect(grid).toStrictEqual({
      width: 7,
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 7),
      offset: 0,
      rows: [
        {
          trackCount: 0,
          startDate: fromUTC(2024, 0, 1),
          endDate: fromUTC(2024, 0, 7),
          cells: [
            { date: fromUTC(2024, 0, 1), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 2), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 3), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 4), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 5), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 6), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 7), tracks: [], durationMs: 0 },
          ],
        },
      ],
    })
  })

  test('two rows showing two weeks', () => {
    // note: that 2024 is a good year to test this
    // with this as it starts on a Monday

    const grid = buildGrid({
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 14),
      width: 7,
    })

    expect(renderGrid(grid)).toMatchInlineSnapshot(`
      "
      +------------+------------+------------+------------+------------+------------+------------+
      |      1 Jan |      2 Jan |      3 Jan |      4 Jan |      5 Jan |      6 Jan |      7 Jan |
      +------------+------------+------------+------------+------------+------------+------------+
      |      8 Jan |      9 Jan |     10 Jan |     11 Jan |     12 Jan |     13 Jan |     14 Jan |
      +------------+------------+------------+------------+------------+------------+------------+
      "
    `)

    expect(grid).toStrictEqual({
      width: 7,
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 14),
      offset: 0,
      rows: [
        {
          trackCount: 0,
          startDate: fromUTC(2024, 0, 1),
          endDate: fromUTC(2024, 0, 7),
          cells: [
            { date: fromUTC(2024, 0, 1), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 2), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 3), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 4), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 5), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 6), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 7), tracks: [], durationMs: 0 },
          ],
        },
        {
          trackCount: 0,
          startDate: fromUTC(2024, 0, 8),
          endDate: fromUTC(2024, 0, 14),
          cells: [
            { date: fromUTC(2024, 0, 8), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 9), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 10), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 11), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 12), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 13), tracks: [], durationMs: 0 },
            { date: fromUTC(2024, 0, 14), tracks: [], durationMs: 0 },
          ],
        },
      ],
    })
  })

  test('offset with blank cells when the first day is not a Monday', () => {
    const grid = buildGrid({
      startDate: fromUTC(2025, 0, 1),
      endDate: fromUTC(2025, 0, 14),
      width: 7,
    })

    expect(grid).toStrictEqual({
      width: 7,
      startDate: fromUTC(2025, 0, 1),
      endDate: fromUTC(2025, 0, 14),
      offset: 2,
      rows: [
        {
          trackCount: 0,
          startDate: fromUTC(2025, 0, 1),
          endDate: fromUTC(2025, 0, 5),
          cells: [
            undefined,
            undefined,
            { date: fromUTC(2025, 0, 1), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 2), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 3), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 4), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 5), tracks: [], durationMs: 0 },
          ],
        },
        {
          trackCount: 0,
          startDate: fromUTC(2025, 0, 6),
          endDate: fromUTC(2025, 0, 12),
          cells: [
            { date: fromUTC(2025, 0, 6), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 7), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 8), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 9), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 10), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 11), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 12), tracks: [], durationMs: 0 },
          ],
        },
        {
          trackCount: 0,
          startDate: fromUTC(2025, 0, 13),
          endDate: fromUTC(2025, 0, 14),
          cells: [
            { date: fromUTC(2025, 0, 13), tracks: [], durationMs: 0 },
            { date: fromUTC(2025, 0, 14), tracks: [], durationMs: 0 },
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        },
      ],
    })

    expect(renderGrid(grid)).toMatchInlineSnapshot(`
      "
      +------------+------------+------------+------------+------------+------------+------------+
      |            |            |      1 Jan |      2 Jan |      3 Jan |      4 Jan |      5 Jan |
      +------------+------------+------------+------------+------------+------------+------------+
      |      6 Jan |      7 Jan |      8 Jan |      9 Jan |     10 Jan |     11 Jan |     12 Jan |
      +------------+------------+------------+------------+------------+------------+------------+
      |     13 Jan |     14 Jan |            |            |            |            |            |
      +------------+------------+------------+------------+------------+------------+------------+
      "
    `)
  })
})

describe('pushCalendarSpan', () => {
  test('a single span for the entire week', () => {
    const grid = buildGrid({
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 7),
      width: 7,
    })

    const spanA: CalendarSpan = [
      fromUTC(2024, 0, 1),
      fromUTC(2024, 0, 7),
      LABEL_A,
    ]
    pushCalendarSpan(grid, spanA)

    expect(renderGrid(grid)).toMatchInlineSnapshot(`
      "
      +------------+------------+------------+------------+------------+------------+------------+
      |      1 Jan |      2 Jan |      3 Jan |      4 Jan |      5 Jan |      6 Jan |      7 Jan |
      |  [-- a --- |  --- a --- |  --- a --- |  --- a --- |  --- a --- |  --- a --- |  --- a --] |
      +------------+------------+------------+------------+------------+------------+------------+
      "
    `)

    const trackA = { spans: [spanA] }

    expect(grid).toStrictEqual({
      width: 7,
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 7),
      offset: 0,
      rows: [
        {
          trackCount: 1,
          startDate: fromUTC(2024, 0, 1),
          endDate: fromUTC(2024, 0, 7),
          cells: [
            { date: fromUTC(2024, 0, 1), tracks: [trackA], durationMs: 0 },
            { date: fromUTC(2024, 0, 2), tracks: [trackA], durationMs: 0 },
            { date: fromUTC(2024, 0, 3), tracks: [trackA], durationMs: 0 },
            { date: fromUTC(2024, 0, 4), tracks: [trackA], durationMs: 0 },
            { date: fromUTC(2024, 0, 5), tracks: [trackA], durationMs: 0 },
            { date: fromUTC(2024, 0, 6), tracks: [trackA], durationMs: 0 },
            { date: fromUTC(2024, 0, 7), tracks: [trackA], durationMs: 0 },
          ],
        },
      ],
    })
  })

  test('should stack spans', () => {
    const grid = buildGrid({
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 7),
      width: 7,
    })

    const spanA: CalendarSpan = [
      fromUTC(2024, 0, 1),
      fromUTC(2024, 0, 7),
      LABEL_A,
    ]
    const spanB: CalendarSpan = [
      fromUTC(2024, 0, 2),
      fromUTC(2024, 0, 6),
      LABEL_B,
    ]
    const spanC: CalendarSpan = [
      fromUTC(2024, 0, 3),
      fromUTC(2024, 0, 5),
      LABEL_C,
    ]
    const spanD: CalendarSpan = [
      fromUTC(2024, 0, 4),
      fromUTC(2024, 0, 4),
      LABEL_D,
    ]

    pushCalendarSpan(grid, spanA)
    pushCalendarSpan(grid, spanB)
    pushCalendarSpan(grid, spanC)
    pushCalendarSpan(grid, spanD)

    expect(renderGrid(grid)).toMatchInlineSnapshot(`
      "
      +------------+------------+------------+------------+------------+------------+------------+
      |      1 Jan |      2 Jan |      3 Jan |      4 Jan |      5 Jan |      6 Jan |      7 Jan |
      |  [-- a --- |  --- a --- |  --- a --- |  --- a --- |  --- a --- |  --- a --- |  --- a --] |
      |            |  [-- b --- |  --- b --- |  --- b --- |  --- b --- |  --- b --] |            |
      |            |            |  [-- c --- |  --- c --- |  --- c --] |            |            |
      |            |            |            |  [-- d --] |            |            |            |
      +------------+------------+------------+------------+------------+------------+------------+
      "
    `)

    const trackA = { spans: [spanA] }
    const trackB = { spans: [spanB] }
    const trackC = { spans: [spanC] }
    const trackD = { spans: [spanD] }

    expect(grid).toStrictEqual({
      width: 7,
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 7),
      offset: 0,
      rows: [
        {
          trackCount: 4,
          startDate: fromUTC(2024, 0, 1),
          endDate: fromUTC(2024, 0, 7),
          cells: [
            {
              date: fromUTC(2024, 0, 1),
              tracks: [trackA, undefined, undefined, undefined],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 2),
              tracks: [trackA, trackB, undefined, undefined],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 3),
              tracks: [trackA, trackB, trackC, undefined],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 4),
              tracks: [trackA, trackB, trackC, trackD],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 5),
              tracks: [trackA, trackB, trackC, undefined],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 6),
              tracks: [trackA, trackB, undefined, undefined],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 7),
              tracks: [trackA, undefined, undefined, undefined],
              durationMs: 0,
            },
          ],
        },
      ],
    })
  })

  test('should handle alternating overlapping spans', () => {
    const grid = buildGrid({
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 7),
      width: 7,
    })

    const spanA: CalendarSpan = [
      fromUTC(2024, 0, 1),
      fromUTC(2024, 0, 2),
      LABEL_A,
    ]
    const spanB: CalendarSpan = [
      fromUTC(2024, 0, 2),
      fromUTC(2024, 0, 3),
      LABEL_B,
    ]
    const spanC: CalendarSpan = [
      fromUTC(2024, 0, 3),
      fromUTC(2024, 0, 4),
      LABEL_C,
    ]
    const spanD: CalendarSpan = [
      fromUTC(2024, 0, 4),
      fromUTC(2024, 0, 5),
      LABEL_D,
    ]
    const spanE: CalendarSpan = [
      fromUTC(2024, 0, 5),
      fromUTC(2024, 0, 6),
      LABEL_E,
    ]
    const spanF: CalendarSpan = [
      fromUTC(2024, 0, 6),
      fromUTC(2024, 0, 7),
      LABEL_F,
    ]

    pushCalendarSpan(grid, spanA)
    pushCalendarSpan(grid, spanB)
    pushCalendarSpan(grid, spanC)
    pushCalendarSpan(grid, spanD)
    pushCalendarSpan(grid, spanE)
    pushCalendarSpan(grid, spanF)

    expect(renderGrid(grid)).toMatchInlineSnapshot(`
      "
      +------------+------------+------------+------------+------------+------------+------------+
      |      1 Jan |      2 Jan |      3 Jan |      4 Jan |      5 Jan |      6 Jan |      7 Jan |
      |  [-- a --- |  --- a --] |  [-- c --- |  --- c --] |  [-- e --- |  --- e --] |            |
      |            |  [-- b --- |  --- b --] |  [-- d --- |  --- d --] |  [-- f --- |  --- f --] |
      +------------+------------+------------+------------+------------+------------+------------+
      "
    `)

    const trackA = { spans: [spanA] }
    const trackB = { spans: [spanB] }
    const trackC = { spans: [spanC] }
    const trackD = { spans: [spanD] }
    const trackE = { spans: [spanE] }
    const trackF = { spans: [spanF] }

    expect(grid).toStrictEqual({
      width: 7,
      startDate: fromUTC(2024, 0, 1),
      endDate: fromUTC(2024, 0, 7),
      offset: 0,
      rows: [
        {
          trackCount: 2,
          startDate: fromUTC(2024, 0, 1),
          endDate: fromUTC(2024, 0, 7),
          cells: [
            {
              date: fromUTC(2024, 0, 1),
              tracks: [trackA, undefined],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 2),
              tracks: [trackA, trackB],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 3),
              tracks: [trackC, trackB],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 4),
              tracks: [trackC, trackD],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 5),
              tracks: [trackE, trackD],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 6),
              tracks: [trackE, trackF],
              durationMs: 0,
            },
            {
              date: fromUTC(2024, 0, 7),
              tracks: [undefined, trackF],
              durationMs: 0,
            },
          ],
        },
      ],
    })
  })

  test('should handle spans that overlap multiple weeks', () => {
    const grid = buildGrid({
      startDate: fromUTC(2025, 0, 1),
      endDate: fromUTC(2025, 0, 28),
      width: 7,
    })

    const _spanA: CalendarSpan = [
      fromUTC(2025, 0, 5),
      fromUTC(2025, 0, 21),
      LABEL_A,
    ]
    const spanB: CalendarSpan = [
      fromUTC(2025, 0, 18),
      fromUTC(2025, 0, 28),
      LABEL_B,
    ]

    // pushCalendarSpan(grid, spanA)
    pushCalendarSpan(grid, spanB)

    expect(renderGrid(grid)).toMatchInlineSnapshot(`
      "
      +------------+------------+------------+------------+------------+------------+------------+
      |            |            |      1 Jan |      2 Jan |      3 Jan |      4 Jan |      5 Jan |
      +------------+------------+------------+------------+------------+------------+------------+
      |      6 Jan |      7 Jan |      8 Jan |      9 Jan |     10 Jan |     11 Jan |     12 Jan |
      +------------+------------+------------+------------+------------+------------+------------+
      |     13 Jan |     14 Jan |     15 Jan |     16 Jan |     17 Jan |     18 Jan |     19 Jan |
      |            |            |            |            |            |  [-- b --- |  --- b --- |
      +------------+------------+------------+------------+------------+------------+------------+
      |     20 Jan |     21 Jan |     22 Jan |     23 Jan |     24 Jan |     25 Jan |     26 Jan |
      |  --- b --- |  --- b --- |  --- b --- |  --- b --- |  --- b --- |  --- b --- |  --- b --- |
      +------------+------------+------------+------------+------------+------------+------------+
      |     27 Jan |     28 Jan |            |            |            |            |            |
      |  --- b --- |  --- b --] |            |            |            |            |            |
      +------------+------------+------------+------------+------------+------------+------------+
      "
    `)
  })
})

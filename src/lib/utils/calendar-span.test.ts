import { describe, expect, test } from 'vitest'

import type { LabelId } from '#lib/ids.js'
import type { CalendarSpan } from './calendar-span.js'

import { fromUTC } from './calendar-date.js'
import { mergeCalendarSpanList } from './calendar-span.js'

const LABEL_A = 'a' as LabelId
const LABEL_B = 'b' as LabelId

describe('mergeCalendarSpanList', () => {
  test('handle an empty list', () => {
    const list: CalendarSpan[] = []

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual([])
  })

  test('handle a list with one item', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual(list)
  })

  test('disjoint items with the same label are left alone', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
      [fromUTC(2023, 0, 11), fromUTC(2023, 0, 12), LABEL_A],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual(list)
  })

  test('neighboring items with the same label are merged', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
      [fromUTC(2023, 0, 3), fromUTC(2023, 0, 5), LABEL_A],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual([
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 5), LABEL_A],
    ])
  })

  test('neighboring items with the same label are merged (reversed)', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 3), fromUTC(2023, 0, 5), LABEL_A],
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual([
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 5), LABEL_A],
    ])
  })

  test('neighbouring items with different labels are left alone', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
      [fromUTC(2023, 0, 3), fromUTC(2023, 0, 5), LABEL_B],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual(list)
  })

  test('overlapping items with different labels are left alone', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
      [fromUTC(2023, 0, 2), fromUTC(2023, 0, 3), LABEL_B],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual(list)
  })

  test('right-overlapping items with the same label are merged', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
      [fromUTC(2023, 0, 2), fromUTC(2023, 0, 3), LABEL_A],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual([
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 3), LABEL_A],
    ])
  })

  test('left-overlapping items with the same label are merged', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 2), fromUTC(2023, 0, 3), LABEL_A],
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual([
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 3), LABEL_A],
    ])
  })

  test('fully-overlapping items with the same label are merged', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 3), LABEL_A],
      [fromUTC(2023, 0, 2), fromUTC(2023, 0, 2), LABEL_A],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual([
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 3), LABEL_A],
    ])
  })

  test('identical items with the same label are merged', () => {
    const list: CalendarSpan[] = [
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
    ]

    const result = mergeCalendarSpanList(list)
    expect(result).toStrictEqual([
      [fromUTC(2023, 0, 1), fromUTC(2023, 0, 2), LABEL_A],
    ])
  })
})

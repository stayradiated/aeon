import { expect, test } from 'vitest'

import { getLineHeight } from './get-line-height.js'

test('should increase by 44px every double', () => {
  expect(getLineHeight(15 * 60 * 1000)).toBe(44)
  expect(getLineHeight(30 * 60 * 1000)).toBe(88)
  expect(getLineHeight(60 * 60 * 1000)).toBe(132)
  expect(getLineHeight(120 * 60 * 1000)).toBe(176)
  expect(getLineHeight(240 * 60 * 1000)).toBe(220)
  expect(getLineHeight(480 * 60 * 1000)).toBe(264)
  expect(getLineHeight(960 * 60 * 1000)).toBe(308)
})

test('should have a minimum height of 44px', () => {
  expect(getLineHeight(0)).toBe(44)
  expect(getLineHeight(5 * 60 * 1000)).toBe(44)
  expect(getLineHeight(10 * 60 * 1000)).toBe(44)
})

test('should smoothly interpolate', () => {
  expect(getLineHeight(100 * 60 * 1000)).toBe(164)
  expect(getLineHeight(101 * 60 * 1000)).toBe(165)
  expect(getLineHeight(102 * 60 * 1000)).toBe(166)
})

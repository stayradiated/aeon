import { expect, test } from 'vitest'

import { mask } from './mask.js'

test('[default] mask everything', () => {
  const input = '1234567890'
  const output = mask(input)
  expect(output).toBe('**********')
})

test('replace with -', () => {
  const input = '1234567890'
  const output = mask(input, { replace: '-' })
  expect(output).toBe('----------')
})

test('show first 2 chars', () => {
  const input = '1234567890'
  const output = mask(input, { showFirst: 2 })
  expect(output).toBe('12********')
})

test('show last 2 chars', () => {
  const input = '1234567890'
  const output = mask(input, { showLast: 2 })
  expect(output).toBe('********90')
})

test('show first 2 and last 2 chars', () => {
  const input = '1234567890'
  const output = mask(input, { showFirst: 2, showLast: 2 })
  expect(output).toBe('12******90')
})

test('truncate middle when too long', () => {
  const input = 'abcdefghijklmnopqrstuvwxyz'
  const output = mask(input, { showFirst: 2, showLast: 2, maxLength: 10 })
  expect(output).toBe('ab**…**yz')
})

import { expect, test } from 'vitest'

import { initEmojiMart, lookupEmojiName } from './emoji.js'

test('lookupEmojiName', async () => {
  await initEmojiMart()

  expect(lookupEmojiName('😀')).toBe('grinning')
  expect(lookupEmojiName('👍')).toBe('+1')
  expect(lookupEmojiName('👎')).toBe('-1')
  expect(lookupEmojiName('🤔')).toBe('thinking_face')
  expect(lookupEmojiName('😎')).toBe('sunglasses')
  expect(lookupEmojiName('💩')).toBe('hankey')
})

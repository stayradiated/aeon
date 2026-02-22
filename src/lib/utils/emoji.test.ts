import { expect, test } from 'vitest'

import { initEmojiMart, lookupEmojiName } from './emoji.js'

test('lookupEmojiName', async () => {
  await initEmojiMart()

  expect(await lookupEmojiName('😀')).toBe('grinning')
  expect(await lookupEmojiName('👍')).toBe('+1')
  expect(await lookupEmojiName('👎')).toBe('-1')
  expect(await lookupEmojiName('🤔')).toBe('thinking_face')
  expect(await lookupEmojiName('😎')).toBe('sunglasses')
  expect(await lookupEmojiName('💩')).toBe('hankey')
})

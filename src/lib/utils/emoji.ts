import type { Emoji } from '@emoji-mart/data'
import data from '@emoji-mart/data'
import * as emojiMart from 'emoji-mart'

import { once } from '#lib/utils/once.js'

const initEmojiMart = once(() => {
  return emojiMart.init({ data })
})

// map native emoji to id
const getNativeEmojiRecord = once((): Record<string, string> => {
  const { emojis } = data as { emojis: Record<string, Emoji> }
  const emojiRecord: Record<string, string> = {}
  for (const emoji of Object.values(emojis)) {
    for (const skin of emoji.skins) {
      emojiRecord[skin.native] = emoji.id
    }
  }
  return emojiRecord
})

const lookupEmojiName = (unicodeEmoji: string): string | undefined => {
  return getNativeEmojiRecord()[unicodeEmoji]
}

export { initEmojiMart, lookupEmojiName }

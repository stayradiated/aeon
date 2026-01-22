import data from '@emoji-mart/data'
import * as emojiMart from 'emoji-mart'

import { once } from '#lib/utils/once.js'

const initEmojiMart = once(() => {
  return emojiMart.init({ data })
})

export { initEmojiMart }

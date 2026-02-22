import { WebClient } from '@slack/web-api'
import { errorBoundary } from '@stayradiated/error-boundary'
import * as dateFns from 'date-fns'

import { lookupEmojiName } from '#lib/utils/emoji.js'

type SetSlackStatusOptions = {
  slackToken: string
  text: string
  emoji: string
  durationHours: number
}

const setSlackStatus = async (
  options: SetSlackStatusOptions,
): Promise<void | Error> => {
  const { slackToken, text, emoji, durationHours } = options

  return errorBoundary(async () => {
    const emojiName = lookupEmojiName(emoji)

    const web = new WebClient(slackToken)

    await web.users.profile.set({
      profile: {
        status_text: text,
        status_emoji: emojiName ? `:${emojiName}:` : null,
        status_expiration: dateFns.getUnixTime(
          dateFns.addHours(Date.now(), durationHours),
        ),
      },
    })
  })
}

export { setSlackStatus }

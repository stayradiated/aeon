import type { AnonUser } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

import { mask } from '#lib/utils/mask.js'

const userSetSlackToken: LocalMutator<'user_setSlackToken'> = async (
  context,
  options,
) => {
  const { tx, sessionUserId } = context
  const { slackToken } = options

  const key = Key.user.encode(sessionUserId)
  const user = await tx.get<AnonUser>(key)
  if (!user) {
    return new Error('User not found')
  }

  const slackTokenMasked = slackToken
    ? mask(slackToken, { showFirst: 4, showLast: 4, replace: '*' })
    : undefined

  await tx.set(key, {
    ...user,
    slackTokenMasked,
  } satisfies AnonUser)
}

export default userSetSlackToken

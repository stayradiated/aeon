import type { ServerMutator } from './types.ts'

import { scheduleUpdateUserStatus } from '#lib/server/worker.js'

import { updateUser } from '#lib/server/db/user/update-user.js'

const userSetSlackToken: ServerMutator<'user_setSlackToken'> = async (
  context,
  options,
) => {
  const { db, sessionUserId } = context
  const { slackToken } = options

  const result = await updateUser({
    db,
    where: {
      userId: sessionUserId,
    },
    set: {
      slackToken: slackToken ?? null,
    },
  })
  if (result instanceof Error) {
    return result
  }

  await scheduleUpdateUserStatus({ userId: context.sessionUserId })
}

export default userSetSlackToken

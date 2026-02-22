import type { AnonStatus } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const statusSetPrompt: LocalMutator<'status_setPrompt'> = async (
  context,
  options,
) => {
  const { tx, sessionUserId } = context
  const { prompt } = options

  const key = Key.status.encode(sessionUserId)
  const value = await tx.get<AnonStatus>(key)
  await tx.set(key, {
    isEnabled: false,
    streamIdList: [],
    status: '',
    emoji: '',
    expiresAt: undefined,
    ...value,
    prompt,
  } satisfies AnonStatus)
}

export default statusSetPrompt

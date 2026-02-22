import type { AnonStatus } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const statusToggleEnabled: LocalMutator<'status_toggleEnabled'> = async (
  context,
  options,
) => {
  const { tx, sessionUserId } = context
  const { isEnabled } = options

  const key = Key.status.encode(sessionUserId)
  const value = await tx.get<AnonStatus>(key)
  await tx.set(key, {
    prompt: '',
    streamIdList: [],
    status: '',
    emoji: '',
    expiresAt: undefined,
    ...value,
    isEnabled,
  } satisfies AnonStatus)
}

export default statusToggleEnabled

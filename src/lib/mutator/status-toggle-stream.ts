import type { AnonStatus } from '#lib/core/replicache/types.js'
import type { LocalMutator } from './types.ts'

import * as Key from '#lib/core/replicache/keys.js'

const statusToggleStream: LocalMutator<'status_toggleStream'> = async (
  context,
  options,
) => {
  const { tx, sessionUserId } = context
  const { streamId, isEnabled } = options

  const key = Key.status.encode(sessionUserId)
  const value = await tx.get<AnonStatus>(key)

  const streamIdList = value?.streamIdList?.slice() ?? []
  if (isEnabled) {
    if (!streamIdList.includes(streamId)) {
      streamIdList.push(streamId)
    }
  } else {
    streamIdList.splice(streamIdList.indexOf(streamId), 1)
  }

  await tx.set(key, {
    isEnabled: false,
    prompt: '',
    status: '',
    emoji: '',
    expiresAt: undefined,
    ...value,
    streamIdList,
  } satisfies AnonStatus)
}

export default statusToggleStream

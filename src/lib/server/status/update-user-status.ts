import * as dateFns from 'date-fns'

import type { StreamId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'

import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { getActiveLineList } from '#lib/server/db/line/get-active-line-list.js'
import { getStatus } from '#lib/server/db/status/get-status.js'
import { updateStatus } from '#lib/server/db/status/update-status.js'
import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'
import { getUser } from '#lib/server/db/user/get-user.js'

import { fingerprintHash } from '#lib/server/crypto/hash.js'

import { promiseAllRecord } from '#lib/utils/promise-all-record.js'

import { generateStatus } from './ai.js'
import { serialisePointList } from './serialise-point-list.js'
import { setSlackStatus } from './slack.js'

const STATUS_EXPIRY_HOURS = 3

type GenStatusLineOptions = {
  db: KyselyDb
  userId: UserId
}

const updateUserStatus = async (
  options: GenStatusLineOptions,
): Promise<void | Error> => {
  const { db, userId } = options

  const user = await getUser({ db, where: { userId } })
  if (user instanceof Error) {
    return user
  }
  // silently abort if user does not exist
  if (!user) {
    return
  }

  const prevStatus = await getStatus({ db, where: { userId } })
  if (prevStatus instanceof Error) {
    return prevStatus
  }
  // silently abort if status is not enabled
  if (!prevStatus || !prevStatus.enabledAt) {
    return
  }

  const streamIdList = prevStatus.streamIdList as StreamId[]

  const activeLineList = await getActiveLineList({
    db,
    where: { userId, streamId: { in: streamIdList } },
  })
  if (activeLineList instanceof Error) {
    return activeLineList
  }

  const labelIdList = activeLineList.flatMap((line) => line.labelIdList)

  const tables = await promiseAllRecord({
    streamList: getStreamList({
      db,
      where: { userId, streamId: { in: streamIdList } },
    }),
    labelList: getLabelList({
      db,
      where: { userId, labelId: { in: labelIdList } },
    }),
  })
  if (tables instanceof Error) {
    return tables
  }
  const { streamList, labelList } = tables

  const streamRecord = Object.fromEntries(
    streamList.map((stream) => [stream.id, stream]),
  )
  const labelRecord = Object.fromEntries(
    labelList.map((label) => [label.id, label]),
  )

  const statusInput = `${prevStatus.prompt}\n\n${serialisePointList({
    pointList: activeLineList,
    streamRecord,
    labelRecord,
  })}`

  // do not generate new status, if the input hasn’t changed
  const hash = Buffer.from(fingerprintHash.hash(statusInput)).toString('base64')
  if (hash === prevStatus.hash) {
    return
  }

  console.info('[status] Generating status…')

  const result = await generateStatus({ currentStatus: statusInput })
  if (result instanceof Error) {
    return result
  }

  const updateResult = await updateStatus({
    db,
    where: { userId },
    set: {
      hash,
      emoji: result.emoji,
      status: result.status,
      expiresAt: dateFns.addHours(Date.now(), STATUS_EXPIRY_HOURS).getTime(),
    },
  })
  if (updateResult instanceof Error) {
    return updateResult
  }

  if (user?.slackToken) {
    const slackresult = await setSlackStatus({
      slackToken: user.slackToken,
      text: result.status,
      emoji: result.emoji,
      durationHours: STATUS_EXPIRY_HOURS,
    })
    if (slackresult instanceof Error) {
      console.error(slackresult)
    }
  }

  return
}

export { updateUserStatus }

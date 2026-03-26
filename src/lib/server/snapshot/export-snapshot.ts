import type { UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Snapshot } from './schema.js'

import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { getPointList } from '#lib/server/db/point/get-point-list.js'
import { getStatus } from '#lib/server/db/status/get-status.js'
import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'
import { getUserList } from '#lib/server/db/user/get-user-list.js'

import { promiseAllRecord } from '#lib/utils/promise-all-record.js'

import { $Snapshot } from './schema.js'

type ExportSnapshotOptions = {
  db: KyselyDb
  userId: UserId
}

const exportSnapshot = async (
  options: ExportSnapshotOptions,
): Promise<Snapshot | Error> => {
  const { db, userId } = options

  const snapshot = await promiseAllRecord({
    user: getUserList({ db, where: { userId } }),
    stream: getStreamList({ db, where: { userId } }),
    label: getLabelList({ db, where: { userId } }),
    point: getPointList({ db, where: { userId } }),
    status: getStatus({ db, where: { userId } }),
  })
  if (snapshot instanceof Error) {
    return snapshot
  }

  return $Snapshot.decode({
    ...snapshot,
    status: snapshot.status ? [snapshot.status] : [],
  })
}

export { exportSnapshot }

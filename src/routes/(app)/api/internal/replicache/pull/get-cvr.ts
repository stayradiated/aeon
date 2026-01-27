import type { PatchOperation, ReadonlyJSONValue } from 'replicache'

import type {
  AnonLabel,
  AnonMetaTask,
  AnonPoint,
  AnonStream,
  AnonUser,
} from '#lib/core/replicache/types.js'
import type { LabelId, ReplicacheClientGroupId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { CVR, CVRDiff } from '#lib/server/replicache/cvr.js'
import type { Key as GenericKey } from '#lib/utils/create-key.js'

import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { getLabelVersionRecord } from '#lib/server/db/label/get-label-version-record.js'
import { getMetaTaskList } from '#lib/server/db/meta-task/get-meta-task-list.js'
import { getMetaTaskVersionRecord } from '#lib/server/db/meta-task/get-meta-task-version-record.js'
import { getPointList } from '#lib/server/db/point/get-point-list.js'
import { getPointVersionRecord } from '#lib/server/db/point/get-point-version-record.js'
import { getReplicacheClientVersionRecord } from '#lib/server/db/replicache-client/get-replicache-client-version-record.js'
import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'
import { getStreamVersionRecord } from '#lib/server/db/stream/get-stream-version-record.js'
import { getUserList } from '#lib/server/db/user/get-user-list.js'
import { getUserVersionRecord } from '#lib/server/db/user/get-user-version-record.js'

import * as Key from '#lib/core/replicache/keys.js'

import { promiseAllRecord } from '#lib/utils/promise-all-record.js'

const buildPatchList = <
  Name extends string,
  EntityId extends string,
  Value extends { id: EntityId },
  AnonValue extends ReadonlyJSONValue,
>(
  key: GenericKey<Name, [EntityId], string>,
  diff: { dels: EntityId[]; puts: EntityId[] },
  entityList: Value[],
  transform: (entity: Value) => AnonValue,
): PatchOperation[] => {
  const patchList: PatchOperation[] = []
  for (const entityId of diff.dels) {
    patchList.push({ op: 'del', key: key.encode(entityId) })
  }
  for (const entity of entityList) {
    patchList.push({
      op: 'put',
      key: key.encode(entity.id),
      value: transform(entity),
    })
  }
  return patchList
}

type GetNextCVROptions = {
  db: KyselyDb
  sessionUserId: UserId
  replicacheClientGroupId: ReplicacheClientGroupId
}

const getNextCVR = async (options: GetNextCVROptions): Promise<CVR | Error> => {
  const { db, sessionUserId, replicacheClientGroupId } = options

  return promiseAllRecord({
    point: getPointVersionRecord({ db, where: { userId: sessionUserId } }),
    stream: getStreamVersionRecord({
      db,
      where: { userId: sessionUserId },
    }),
    label: getLabelVersionRecord({ db, where: { userId: sessionUserId } }),
    user: getUserVersionRecord({ db, where: { userId: sessionUserId } }),
    metaTask: getMetaTaskVersionRecord({
      db,
      where: { userId: sessionUserId },
    }),
    replicacheClient: getReplicacheClientVersionRecord({
      db,
      where: { replicacheClientGroupId },
    }),
  })
}

type GetEntitiesOptions = {
  db: KyselyDb
  diff: CVRDiff
  sessionUserId: UserId
}

const getEntities = async (
  options: GetEntitiesOptions,
): Promise<PatchOperation[] | Error> => {
  const { db, sessionUserId, diff } = options

  const entities = await promiseAllRecord({
    point: getPointList({
      db,
      where: { userId: sessionUserId, pointId: { in: diff.point.puts } },
    }),
    label: getLabelList({
      db,
      where: { userId: sessionUserId, labelId: { in: diff.label.puts } },
    }),
    stream: getStreamList({
      db,
      where: { userId: sessionUserId, streamId: { in: diff.stream.puts } },
    }),
    user:
      diff.user.puts.length > 0
        ? getUserList({
            db,
            where: { userId: sessionUserId },
          })
        : [],
    metaTask: getMetaTaskList({
      db,
      where: { userId: sessionUserId, metaTaskId: { in: diff.metaTask.puts } },
    }),
  })
  if (entities instanceof Error) {
    console.error(entities)
    return new Error('Could not get entities.', { cause: entities })
  }

  return Array.from<PatchOperation>({ length: 0 }).concat(
    buildPatchList(
      Key.point,
      diff.point,
      entities.point,
      (entity): AnonPoint => ({
        streamId: entity.streamId,
        labelIdList: entity.labelIdList as LabelId[],
        description: entity.description,
        startedAt: entity.startedAt,
      }),
    ),
    buildPatchList(
      Key.label,
      diff.label,
      entities.label,
      (entity): AnonLabel => ({
        streamId: entity.streamId,
        name: entity.name,
        icon: entity.icon ?? undefined,
        color: entity.color ?? undefined,
        parentId: entity.parentId ?? undefined,
      }),
    ),
    buildPatchList(
      Key.stream,
      diff.stream,
      entities.stream,
      (entity): AnonStream => ({
        name: entity.name,
        parentId: entity.parentId ?? undefined,
        sortOrder: entity.sortOrder,
      }),
    ),
    buildPatchList(
      Key.user,
      diff.user,
      entities.user,
      (entity): AnonUser => ({
        email: entity.email,
        timeZone: entity.timeZone,
      }),
    ),
    buildPatchList(
      Key.metaTask,
      diff.metaTask,
      entities.metaTask,
      (entity): AnonMetaTask => ({
        name: entity.name,
        status: entity.status,
        lastStartedAt: entity.lastStartedAt,
        lastFinishedAt: entity.lastFinishedAt ?? undefined,
      }),
    ),
  )
}

export { getNextCVR, getEntities }

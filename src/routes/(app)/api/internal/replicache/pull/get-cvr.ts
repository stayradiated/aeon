import * as dateFns from 'date-fns'
import type { PatchOperation, ReadonlyJSONValue } from 'replicache'

import type {
  AnonLabel,
  AnonMetaTask,
  AnonPoint,
  AnonStatus,
  AnonStream,
  AnonUser,
} from '#lib/core/replicache/types.js'
import type {
  LabelId,
  ReplicacheClientGroupId,
  StreamId,
  UserId,
} from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { CVR, CVRDiff } from '#lib/server/replicache/cvr.js'
import type { Key as GenericKey } from '#lib/utils/create-key.js'

import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { getLabelUsageList } from '#lib/server/db/label/get-label-usage-list.js'
import { getLabelVersionRecord } from '#lib/server/db/label/get-label-version-record.js'
import { getMetaTaskList } from '#lib/server/db/meta-task/get-meta-task-list.js'
import { getMetaTaskVersionRecord } from '#lib/server/db/meta-task/get-meta-task-version-record.js'
import { getPointList } from '#lib/server/db/point/get-point-list.js'
import { getPointVersionRecord } from '#lib/server/db/point/get-point-version-record.js'
import { getReplicacheClientVersionRecord } from '#lib/server/db/replicache-client/get-replicache-client-version-record.js'
import { getStatusList } from '#lib/server/db/status/get-status-list.js'
import { getStatusVersionRecord } from '#lib/server/db/status/get-status-version-record.js'
import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'
import { getStreamVersionRecord } from '#lib/server/db/stream/get-stream-version-record.js'
import { getUserList } from '#lib/server/db/user/get-user-list.js'
import { getUserVersionRecord } from '#lib/server/db/user/get-user-version-record.js'

import * as Key from '#lib/core/replicache/keys.js'

import { mask } from '#lib/utils/mask.js'
import { promiseAllRecord } from '#lib/utils/promise-all-record.js'

const buildPatchList = <
  Name extends string,
  EntityId extends string,
  Value,
  AnonValue extends ReadonlyJSONValue,
>(
  key: GenericKey<Name, [EntityId], string>,
  diff: { dels: EntityId[] },
  entityList: Value[],
  getId: (entity: Value) => EntityId,
  transform: (entity: Value) => AnonValue,
): PatchOperation[] => {
  const patchList: PatchOperation[] = []
  for (const entityId of diff.dels) {
    patchList.push({ op: 'del', key: key.encode(entityId) })
  }
  for (const entity of entityList) {
    patchList.push({
      op: 'put',
      key: key.encode(getId(entity)),
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
    status: getStatusVersionRecord({ db, where: { userId: sessionUserId } }),
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
    labelPopularity: getLabelUsageList({
      db,
      where: {
        userId: sessionUserId,
        labelId: { in: diff.label.puts },
        point: {
          startedAt: {
            gte: dateFns.subDays(Date.now(), 7).getTime(),
            lte: Date.now(),
          },
        },
      },
    }),
    labelUsage: getLabelUsageList({
      db,
      where: {
        userId: sessionUserId,
        labelId: { in: diff.label.puts },
      },
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
    status:
      diff.status.puts.length > 0
        ? getStatusList({ db, where: { userId: sessionUserId } })
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

  const labelPopularityRecord: Record<LabelId, number> = Object.fromEntries(
    entities.labelPopularity.map((usage) => [usage.id, usage.count]),
  )
  const labelUsageRecord: Record<
    LabelId,
    { count: number; lastStartedAt: number }
  > = Object.fromEntries(
    entities.labelUsage.map((usage) => [
      usage.id,
      {
        count: usage.count,
        lastStartedAt: usage.maxStartedAt,
      },
    ]),
  )

  return Array.from<PatchOperation>({ length: 0 }).concat(
    buildPatchList(
      Key.point,
      diff.point,
      entities.point,
      (entity) => entity.id,
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
      (entity) => entity.id,
      (entity): AnonLabel => ({
        streamId: entity.streamId,
        name: entity.name,
        icon: entity.icon ?? undefined,
        color: entity.color ?? undefined,
        parentLabelIdList: entity.parentLabelIdList,
        popularity: labelPopularityRecord[entity.id] ?? 0,
        pointCount: labelUsageRecord[entity.id]?.count ?? 0,
        lastStartedAt: labelUsageRecord[entity.id]?.lastStartedAt,
      }),
    ),
    buildPatchList(
      Key.stream,
      diff.stream,
      entities.stream,
      (entity) => entity.id,
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
      (entity) => entity.id,
      (entity): AnonUser => ({
        email: entity.email,
        slackTokenMasked: entity.slackToken
          ? mask(entity.slackToken, { showFirst: 4, showLast: 4, replace: '*' })
          : undefined,
      }),
    ),
    buildPatchList(
      Key.metaTask,
      diff.metaTask,
      entities.metaTask,
      (entity) => entity.id,
      (entity): AnonMetaTask => ({
        name: entity.name,
        status: entity.status,
        lastStartedAt: entity.lastStartedAt,
        lastFinishedAt: entity.lastFinishedAt ?? undefined,
      }),
    ),
    buildPatchList(
      Key.status,
      diff.status,
      entities.status,
      (entity) => entity.userId,
      (entity): AnonStatus => ({
        isEnabled: entity.enabledAt !== null,
        prompt: entity.prompt,
        // TODO: refactor to use foreign key
        streamIdList: entity.streamIdList as StreamId[],
        expiresAt: entity.expiresAt ?? undefined,
        status: entity.status,
        emoji: entity.emoji,
      }),
    ),
  )
}

export { getNextCVR, getEntities }

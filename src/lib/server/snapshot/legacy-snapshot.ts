import { z } from 'zod'

import type { Snapshot } from './schema.js'

import { $LabelId, $PointId, $StreamId, $UserId } from '#lib/schema.js'

const $LegacySnapshot = z.object({
  user: z.record(
    z.string(),
    z.object({
      id: $UserId,
      timeZone: z.string(),
      stravaClientId: z.string().optional(),
      stravaClientSecret: z.string().optional(),
      stravaSession: z
        .object({
          accessToken: z.string(),
          refreshToken: z.string(),
          expiresAt: z.number(),
        })
        .optional(),
      createdAt: z.number(),
      updatedAt: z.number().nullable(),
    }),
  ),
  stream: z.record(
    z.string(),
    z.object({
      id: $StreamId,
      name: z.string(),
      index: z.number(),
      parentId: $StreamId.nullable(),
      createdAt: z.number(),
      updatedAt: z.number().nullable(),
    }),
  ),
  label: z.record(
    z.string(),
    z.object({
      id: $LabelId,
      streamId: $StreamId,
      name: z.string(),
      icon: z.string().nullable(),
      color: z.string().nullable(),
      parentId: $LabelId.nullable(),
      createdAt: z.number(),
      updatedAt: z.number().nullable(),
    }),
  ),
  point: z.record(
    z.string(),
    z.object({
      id: $PointId,
      streamId: $StreamId,
      startedAt: z.number(),
      labelIdList: z.array($LabelId),
      value: z.string(),
      createdAt: z.number(),
      updatedAt: z.number().nullable(),
    }),
  ),
})
type LegacySnapshot = z.infer<typeof $LegacySnapshot>

const migrateLegacySnapshot = (legacySnapshot: LegacySnapshot): Snapshot => {
  return {
    user: Object.values(legacySnapshot.user).map(
      (user): Snapshot['user'][number] => ({
        stravaClientId: user.stravaClientId ?? null,
        stravaClientSecret: user.stravaClientSecret ?? null,
        stravaSession: user.stravaSession ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt ?? user.createdAt,
      }),
    ),
    stream: Object.values(legacySnapshot.stream).map(
      (stream): Snapshot['stream'][number] => ({
        id: stream.id,
        name: stream.name,
        sortOrder: stream.index,
        parentId: stream.parentId,
        createdAt: stream.createdAt,
        updatedAt: stream.updatedAt ?? stream.createdAt,
      }),
    ),
    label: Object.values(legacySnapshot.label).map(
      (label): Snapshot['label'][number] => ({
        id: label.id,
        streamId: label.streamId,
        name: label.name,
        icon: label.icon,
        color: label.color,
        parentLabelIdList: label.parentId ? [label.parentId] : [],
        createdAt: label.createdAt,
        updatedAt: label.updatedAt ?? label.createdAt,
      }),
    ),
    point: Object.values(legacySnapshot.point).map(
      (point): Snapshot['point'][number] => ({
        id: point.id,
        streamId: point.streamId,
        startedAt: point.startedAt,
        labelIdList: point.labelIdList,
        description: point.value,
        createdAt: point.createdAt,
        updatedAt: point.updatedAt ?? point.createdAt,
      }),
    ),
  }
}

export { $LegacySnapshot, migrateLegacySnapshot }
export type { LegacySnapshot }

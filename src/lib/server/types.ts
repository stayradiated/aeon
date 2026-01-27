import type { Selectable } from 'kysely'

import type { DB } from '#lib/server/db/types.js'

export type EmailVerification = Selectable<DB['emailVerification']>
export type Label = Selectable<DB['label']>
export type MetaTask = Selectable<DB['metaTask']>
export type Point = Selectable<DB['point']>
export type PointLabel = Selectable<DB['pointLabel']>
export type PointWithLabelList = Selectable<DB['pointWithLabelList']>
export type ReplicacheClient = Selectable<DB['replicacheClient']>
export type ReplicacheClientGroup = Selectable<DB['replicacheClientGroup']>
export type ReplicacheClientView = Selectable<DB['replicacheClientView']>
export type Stream = Selectable<DB['stream']>
export type User = Selectable<DB['user']>
export type UserSession = Selectable<DB['userSession']>

import type { Selectable } from 'kysely'

import type { DB } from '#lib/server/db/types.js'

export type EmailVerification = Selectable<DB['emailVerification']>
export type Label = Selectable<DB['labelWithParentList']>
export type MetaTask = Selectable<DB['metaTask']>
export type Point = Selectable<DB['pointWithLabelList']>
export type RawLabel = Selectable<DB['label']>
export type RawLabelParent = Selectable<DB['labelParent']>
export type RawPoint = Selectable<DB['point']>
export type RawPointLabel = Selectable<DB['pointLabel']>
export type ReplicacheClient = Selectable<DB['replicacheClient']>
export type ReplicacheClientGroup = Selectable<DB['replicacheClientGroup']>
export type ReplicacheClientView = Selectable<DB['replicacheClientView']>
export type Stream = Selectable<DB['stream']>
export type User = Selectable<DB['user']>
export type UserSession = Selectable<DB['userSession']>

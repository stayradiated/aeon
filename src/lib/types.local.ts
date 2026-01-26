import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'

type LocalUser = {
  readonly id: UserId
  email: string
  timeZone: string
  createdAt: number
  updatedAt: number
}

type LocalLabel = {
  readonly id: LabelId
  streamId: StreamId
  name: string
  icon: string | undefined
  color: string | undefined
  parentId: LabelId | undefined
  createdAt: number
  updatedAt: number
}

type LocalPoint = {
  readonly id: PointId
  streamId: StreamId
  labelIdList: readonly LabelId[]
  description: string
  startedAt: number
  createdAt: number
  updatedAt: number
}

type LocalStream = {
  readonly id: StreamId
  name: string
  sortOrder: number
  parentId: StreamId | undefined
  createdAt: number
  updatedAt: number
}

type LocalMeta = {
  state: 'LOADING' | 'READY'
}

export type {
  LocalUser as User,
  LocalLabel as Label,
  LocalPoint as Point,
  LocalStream as Stream,
  LocalMeta as Meta,
}

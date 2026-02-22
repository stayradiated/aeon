import type {
  LabelId,
  MetaTaskId,
  PointId,
  StreamId,
  UserId,
} from '#lib/ids.js'

type LocalUser = {
  readonly id: UserId
  email: string
  slackTokenMasked: string | undefined
}

type LocalLabel = {
  readonly id: LabelId
  streamId: StreamId
  name: string
  icon: string | undefined
  color: string | undefined
  parentLabelIdList: readonly LabelId[]
  popularity: number
  pointCount: number
  lastStartedAt: number | undefined
}

type LocalPoint = {
  readonly id: PointId
  streamId: StreamId
  labelIdList: readonly LabelId[]
  description: string
  startedAt: number
}

type LocalStream = {
  readonly id: StreamId
  name: string
  sortOrder: number
  parentId: StreamId | undefined
}

type LocalMetaTask = {
  id: MetaTaskId
  name: string
  status: string
  lastStartedAt: number
  lastFinishedAt: number | undefined
}

type LocalMeta = {
  state: 'LOADING' | 'READY'
}

type LocalStatus = {
  isEnabled: boolean
  prompt: string
  streamIdList: readonly StreamId[]

  expiresAt: number | undefined
  status: string
  emoji: string
}

export type {
  LocalUser as User,
  LocalLabel as Label,
  LocalPoint as Point,
  LocalStream as Stream,
  LocalMeta as Meta,
  LocalMetaTask as MetaTask,
  LocalStatus as Status,
}

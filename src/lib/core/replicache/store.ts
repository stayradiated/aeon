import { transact } from 'signia'

import type {
  AnonLabel,
  AnonMetaTask,
  AnonPoint,
  AnonStream,
  AnonUser,
  Replicache,
} from '#lib/core/replicache/types.js'
import type {
  LabelId,
  MetaTaskId,
  PointId,
  StreamId,
  UserId,
} from '#lib/ids.js'
import type { InternalMutatorInput } from '#lib/mutator/types.js'
import type {
  Label,
  Meta,
  MetaTask,
  Point,
  Stream,
  User,
} from '#lib/types.local.js'

import * as Key from '#lib/core/replicache/keys.js'
import { Table } from '#lib/core/replicache/table/table.js'

import { groupBy } from '#lib/utils/group-by.js'
import { mapRecordValues } from '#lib/utils/record.js'

type CreateStoreOptions = {
  rep: Replicache
  sessionUserId: UserId
}

const createStore = (options: CreateStoreOptions) => {
  const { rep, sessionUserId } = options

  const meta = new Table<string, Meta, Meta>({
    key: Key.meta,
    mapValue: (value) => value,
  })
  const metaTask = new Table<MetaTaskId, AnonMetaTask, MetaTask>({
    key: Key.metaTask,
    mapValue: (value, id) => ({ id, ...value }),
  })
  const label = new Table<LabelId, AnonLabel, Label>({
    key: Key.label,
    mapValue: (value, id) => ({ id, ...value }),
  })
  const stream = new Table<StreamId, AnonStream, Stream>({
    key: Key.stream,
    mapValue: (value, id) => ({ id, ...value }),
  })
  const point = new Table<PointId, AnonPoint, Point>({
    key: Key.point,
    mapValue: (value, id) => ({ id, ...value }),
  })
  const user = new Table<UserId, AnonUser, User>({
    key: Key.user,
    mapValue: (value, id) => ({ id, ...value }),
  })

  // biome-ignore lint/suspicious/noExplicitAny: this is fine
  const tableByName: Record<string, Table<any, any, any>> = {
    [Key.user.name]: user,
    [Key.stream.name]: stream,
    [Key.label.name]: label,
    [Key.point.name]: point,
    [Key.metaTask.name]: metaTask,
  }

  const setMetaState = (state: 'READY' | 'LOADING') => {
    const key = Key.meta.encode('store')

    if (state === 'LOADING') {
      meta.pushDiffList([{ op: 'add', key, newValue: { state } }])
    } else {
      meta.pushDiffList([
        { op: 'change', key, newValue: { state }, oldValue: {} },
      ])
    }
  }

  let hasInitialLoad = false
  setMetaState('LOADING')

  rep.experimentalWatch(
    (diffList) => {
      const record = groupBy(diffList, (diff) => {
        const match = diff.key.match(/^(\w+)\//)
        const name = match?.[1]
        return name ?? ''
      })

      transact(() => {
        for (const [name, diffList] of Object.entries(record)) {
          const table = tableByName[name]
          if (!table) {
            console.warn(`No table for "${name}"`)
            continue
          }
          table.pushDiffList(diffList)
        }

        if (!hasInitialLoad) {
          setMetaState('READY')
          hasInitialLoad = true
        }
      })
    },
    {
      initialValuesInFirstDiff: true,
    },
  )

  // whatever we return here _is_ the typeof store
  return {
    id: rep.clientID,
    rep: rep,
    sessionUserId,

    label,
    meta,
    point,
    stream,
    user,
    metaTask,

    mutate: mapRecordValues(
      rep.mutate,
      (fn) => (input: InternalMutatorInput) => {
        return (fn as (input: InternalMutatorInput) => Promise<void>)({
          ...input,
          // we track thse values inside the replicache mutation
          // so that they are persisted between replays
          // and also comitted to the server correctly
          context: {
            ...input.context,
            actionedAt: input.context?.actionedAt ?? Date.now(),
          },
        })
      },
    ) as typeof rep.mutate,
  }
}

type Store = ReturnType<typeof createStore>

export { createStore }
export type { Store }

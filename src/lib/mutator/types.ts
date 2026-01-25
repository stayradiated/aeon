import type { WriteTransaction } from 'replicache'

import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'
import type { Transaction } from '#lib/server/db/types.js'

/*
 * Mutator Definitions
 */

type Mutators = {
  label_create: Mutator<{
    labelId: LabelId
    streamId: StreamId
    parentId: LabelId | undefined
    name: string
    color: string | undefined
    icon: string | undefined
  }>
  label_rename: Mutator<{
    labelId: LabelId
    name: string
  }>
  label_setParent: Mutator<{
    labelId: LabelId
    parentId: LabelId | undefined
  }>
  label_setColor: Mutator<{
    labelId: LabelId
    color: string | undefined
  }>
  label_setIcon: Mutator<{
    labelId: LabelId
    icon: string | undefined
  }>

  stream_create: Mutator<{
    streamId: StreamId
    name: string
  }>
  stream_setParent: Mutator<{
    streamId: StreamId
    parentId: StreamId | undefined
  }>
  stream_rename: Mutator<{
    streamId: StreamId
    name: string
  }>
  stream_sort: Mutator<{
    streamId: StreamId
    delta: -1 | 1
  }>
  stream_delete: Mutator<{
    streamId: StreamId
  }>

  point_create: Mutator<{
    pointId: PointId
    streamId: StreamId
    labelIdList: readonly LabelId[]
    description: string
    startedAt: number
  }>
  point_slide: Mutator<{
    pointId: PointId
    startedAt: number
  }>

  migrate_fixupLabelParents: Mutator<Record<string, never>>

  danger_deleteAllData: Mutator<{
    userHasConfirmed: boolean
  }>
}

/*
 * Typescript Helpers
 */

type DisallowKeys<T, K extends PropertyKey> = T & {
  [P in K]?: never
}

type Mutator<
  Input extends DisallowKeys<Record<string, unknown>, 'context'> = Record<
    string,
    never
  >,
> = {
  input: Input
}

// union of all mutation IDs
type MutatorKey = keyof Mutators

type LocalMutatorContext = {
  tx: WriteTransaction
  actionedAt: number
}

type InternalMutatorInput = {
  context?: {
    // track time which mutation was actioned
    actionedAt?: number
  }
}

type GenericLocalMutator<Input> = (
  context: LocalMutatorContext,
  options: Input & InternalMutatorInput,
) => Promise<void | Error>

// execute a mutation locally (i.e. in the browser)
// these functions are called by the Replicache client
type LocalMutator<Key extends MutatorKey> = GenericLocalMutator<
  Mutators[Key]['input']
>

type ServerMutatorContext = {
  db: Transaction
  sessionUserId: UserId
  actionedAt: number
}

type GenericServerMutator<Input> = (
  context: ServerMutatorContext,
  options: Input,
) => Promise<void | Error>

// execute a mutation on the server
// these functions are called by the server /push endpoint
type ServerMutator<Key extends MutatorKey> = GenericServerMutator<
  Mutators[Key]['input']
>
// mutator config for creating a Replicache instance
type LocalMutatorDefs = {
  [Key in MutatorKey]: LocalMutator<Key>
}
type ServerMutatorDefs = {
  [Key in MutatorKey]: ServerMutator<Key>
}
type ReplicacheMutatorDefs = {
  [K in keyof LocalMutatorDefs]: (
    tx: WriteTransaction,
    args: Parameters<LocalMutatorDefs[K]>[1],
  ) => Promise<Exclude<Awaited<ReturnType<LocalMutatorDefs[K]>>, Error>>
}

type LocalMutatorDefsImportMap<T extends LocalMutatorDefs = LocalMutatorDefs> =
  T extends T
    ? {
        [Key in keyof T & string]: Promise<{ default: T[Key] }>
      }
    : never

type ServerMutatorDefsImportMap<
  T extends ServerMutatorDefs = ServerMutatorDefs,
> = T extends T
  ? {
      [Key in keyof T & string]: Promise<{ default: T[Key] }>
    }
  : never

export type {
  GenericLocalMutator,
  GenericServerMutator,
  LocalMutator,
  LocalMutatorContext,
  LocalMutatorDefs,
  LocalMutatorDefsImportMap,
  InternalMutatorInput,
  Mutator,
  MutatorKey,
  ReplicacheMutatorDefs,
  ServerMutator,
  ServerMutatorContext,
  ServerMutatorDefs,
  ServerMutatorDefsImportMap,
}

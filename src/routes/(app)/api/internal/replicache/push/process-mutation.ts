import { styleText } from 'node:util'
import type { MutationV1 } from 'replicache'

import type {
  ReplicacheClientGroupId,
  ReplicacheClientId,
  UserId,
} from '#lib/ids.js'
import type { InternalMutatorInput } from '#lib/mutator/types.js'
import type { Transaction } from '#lib/server/db/types.js'

import { getReplicacheClientNextMutationId } from '#lib/server/db/replicache-client/get-replicache-client-next-mutation-id.js'
import { upsertReplicacheClient } from '#lib/server/db/replicache-client/upsert-replicache-client.js'
import { getReplicacheClientGroup } from '#lib/server/db/replicache-client-group/get-replicache-client-group.js'
import { upsertReplicacheClientGroup } from '#lib/server/db/replicache-client-group/upsert-replicache-client-group.js'

import { getMutator } from '#lib/server/replicache/get-mutator.js'

type ProcessMutationOptions = {
  db: Transaction
  sessionUserId: UserId
  replicacheClientGroupId: ReplicacheClientGroupId
  mutation: MutationV1
  isErrorMode: boolean
}

const processMutation = async (
  options: ProcessMutationOptions,
): Promise<void | Error> => {
  const { db, sessionUserId, replicacheClientGroupId, mutation, isErrorMode } =
    options
  const replicacheClientId = mutation.clientID as ReplicacheClientId

  const [replicacheClientGroup, nextMutationId] = await Promise.all([
    getReplicacheClientGroup({
      db,
      where: {
        replicacheClientGroupId: replicacheClientGroupId,
        userId: sessionUserId,
      },
    }),
    getReplicacheClientNextMutationId({
      db,
      where: {
        replicacheClientId,
        replicacheClientGroupId,
      },
    }),
  ])
  if (replicacheClientGroup instanceof Error) {
    return replicacheClientGroup
  }
  if (nextMutationId instanceof Error) {
    return nextMutationId
  }

  // It's common due to connectivity issues for clients to send a
  // mutation which has already been processed. Skip these.
  if (mutation.id < nextMutationId) {
    return
  }

  // If the Replicache client is working correctly, this can never
  // happen. If it does there is nothing to do but return an error to
  // client and report a bug to Replicache.
  if (mutation.id > nextMutationId) {
    return new Error(`Mutation ${mutation.id} is from the future - aborting.`)
  }

  if (isErrorMode !== true) {
    console.info(
      styleText(
        'yellow',
        `[PUSH] ${mutation.name}(${JSON.stringify(mutation.args)})`,
      ),
    )

    const mutator = await getMutator(mutation.name)
    if (!mutator) {
      return new Error(`Unknown mutation: ${mutation.name}`)
    }

    const { context, ...input } = mutation.args as InternalMutatorInput
    const result = await mutator(
      {
        db,
        sessionUserId,
        actionedAt: context?.actionedAt ?? Date.now(),
      },
      input,
    )
    if (result instanceof Error) {
      console.error(`[PUSH] Skipping Mutation #${mutation.id} (due to error)
  ${mutation.name}(${JSON.stringify(mutation.args)})`)
      return result
    }
  }

  const updatedReplicacheClientGroup = await upsertReplicacheClientGroup({
    db,
    where: { replicacheClientGroupId },
    set: {
      userId: sessionUserId,
      cvrVersion: replicacheClientGroup.cvrVersion,
    },
  })
  if (updatedReplicacheClientGroup instanceof Error) {
    return updatedReplicacheClientGroup
  }

  const updatedReplicacheClient = await upsertReplicacheClient({
    db,
    where: { replicacheClientId },
    set: { replicacheClientGroupId, lastMutationId: nextMutationId },
  })
  if (updatedReplicacheClient instanceof Error) {
    return updatedReplicacheClient
  }
}

export { processMutation }

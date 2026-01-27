import { error } from '@sveltejs/kit'
import type { PatchOperation, PullResponseOKV1 } from 'replicache'
import { z } from 'zod'

import type { ReplicacheClientId, ReplicacheClientViewId } from '#lib/ids.js'
import type { CVR, VersionRecord } from '#lib/server/replicache/cvr.js'
import type { RequestHandler } from './$types'

import {
  $ReplicacheClientGroupId,
  $ReplicacheClientViewId,
} from '#lib/schema.js'

import { getDb } from '#lib/server/db/get-db.js'
import { transact } from '#lib/server/db/transact.js'

import { getReplicacheClientGroup } from '#lib/server/db/replicache-client-group/get-replicache-client-group.js'
import { upsertReplicacheClientGroup } from '#lib/server/db/replicache-client-group/upsert-replicache-client-group.js'
import { getReplicacheClientView } from '#lib/server/db/replicache-client-view/get-replicache-client-view.js'
import { insertReplicacheClientView } from '#lib/server/db/replicache-client-view/insert-replicache-client-view.js'

import {
  diffCVR,
  EMPTY_CVR,
  isCVRDiffEmpty,
} from '#lib/server/replicache/cvr.js'

import { SCHEMA_VERSION } from '#lib/core/replicache/version.js'

import { genId } from '#lib/utils/gen-id.js'

import { getEntities, getNextCVR } from './get-cvr.js'

const $Cookie = z.object({
  clientViewId: $ReplicacheClientViewId,
  order: z.number(),
})

type Cookie = z.infer<typeof $Cookie>

const $PullRequest = z.object({
  clientGroupID: $ReplicacheClientGroupId,
  cookie: $Cookie.nullable(),
})

type TXResult =
  | {
      type: 'NO_OP'
    }
  | {
      type: 'SUCCESS'
      entities: PatchOperation[]
      clients: VersionRecord<ReplicacheClientId>
      nextCVR: CVR
      nextCVRVersion: number
    }

const POST: RequestHandler = async (event) => {
  const { request, locals } = event

  const sessionUserId = locals.session?.userId
  if (!sessionUserId) {
    return new Response('Must be logged in', { status: 401 })
  }

  const db = getDb()

  const pull = $PullRequest.safeParse(await request.json())
  if (!pull.success) {
    return new Response(z.prettifyError(pull.error), { status: 400 })
  }

  const replicacheClientGroupId = pull.data.clientGroupID
  const requestCookie = pull.data.cookie
  const prevClientViewId = requestCookie?.clientViewId

  // 1: Fetch prevCVR
  let prevCVR: CVR | undefined
  if (prevClientViewId) {
    const cvr = await getReplicacheClientView({
      db,
      where: {
        replicacheClientViewId: prevClientViewId,
        version: SCHEMA_VERSION,
      },
    })
    if (cvr instanceof Error) {
      throw error(500, cvr)
    }
    prevCVR = cvr?.record as CVR
  }

  // 2: Init baseCVR
  const baseCVR: CVR = prevCVR ?? EMPTY_CVR

  // 3: begin transaction
  const txResult = await transact(
    'replicache.pull',
    db,
    async ({ db }): Promise<TXResult | Error> => {
      // 4-5: getClientGroup(body.clientGroupID), verify user
      const baseReplicacheClientGroup = await getReplicacheClientGroup({
        db,
        where: {
          replicacheClientGroupId,
          userId: sessionUserId,
        },
      })
      if (baseReplicacheClientGroup instanceof Error) {
        return new Error('Could not getReplicacheClientGroup', {
          cause: baseReplicacheClientGroup,
        })
      }

      // 6. Read all id/version pairs from the database that should be in the
      // client view
      // 7: Read all clients in Client Group
      // 8: Build nextCVR
      const nextCVR = await getNextCVR({
        db,
        sessionUserId,
        replicacheClientGroupId,
      })
      if (nextCVR instanceof Error) {
        return new Error('Could not get nextCVR', { cause: nextCVR })
      }

      // 9: calculate diffs
      const diff = diffCVR(baseCVR, nextCVR)

      // 10: If diff is empty, return no-op PR
      if (prevCVR && isCVRDiffEmpty(diff)) {
        return {
          type: 'NO_OP',
        }
      }

      // 11: get entities
      const entities = await getEntities({
        db,
        diff,
        sessionUserId,
      })
      if (entities instanceof Error) {
        return new Error('Could not get entities.', { cause: entities })
      }

      // 12: changed clients - no need to re-read clients from database,
      // we already have their versions.
      const clients: VersionRecord<ReplicacheClientId> = {}
      for (const replicacheClientId of diff.replicacheClient.puts) {
        clients[replicacheClientId] =
          nextCVR.replicacheClient[replicacheClientId] ?? 0
      }

      // 13: newCVRVersion
      const baseCVRVersion = pull.data.cookie?.order ?? 0
      const nextCVRVersion =
        Math.max(baseCVRVersion, baseReplicacheClientGroup.cvrVersion) + 1

      // 14: Write ClientGroupRecord
      const nextClientGroupRecord = await upsertReplicacheClientGroup({
        db,
        where: {
          replicacheClientGroupId: baseReplicacheClientGroup.id,
        },
        set: {
          userId: sessionUserId,
          cvrVersion: nextCVRVersion,
        },
      })
      if (nextClientGroupRecord instanceof Error) {
        return nextClientGroupRecord
      }

      return {
        type: 'SUCCESS',
        entities,
        clients,
        nextCVR,
        nextCVRVersion,
      }
    },
    {
      isolationLevel: 'serializable',
    },
  )
  if (txResult instanceof Error) {
    console.error(txResult)
    throw error(500, txResult)
  }

  // 10: If diff is empty, return no-op PR
  if (txResult.type === 'NO_OP') {
    const body: PullResponseOKV1 = {
      cookie: pull.data.cookie,
      lastMutationIDChanges: {},
      patch: [],
    }
    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const { entities, clients, nextCVR, nextCVRVersion } = txResult

  // 16-17: store cvr
  const clientViewId = genId<ReplicacheClientViewId>()
  const insertClientViewResult = await insertReplicacheClientView({
    db,
    where: {
      replicacheClientViewId: clientViewId,
    },
    set: {
      record: nextCVR,
      version: SCHEMA_VERSION,
    },
  })
  if (insertClientViewResult instanceof Error) {
    throw error(500, insertClientViewResult)
  }

  // 18(i): build patch
  if (prevCVR === undefined) {
    entities.unshift({ op: 'clear' })
  }

  // 18(ii): construct cookie
  const cookie: Cookie = {
    order: nextCVRVersion,
    clientViewId,
  }

  // 17(iii): lastMutationIDChanges
  const lastMutationIDChanges = clients

  const body: PullResponseOKV1 = {
    cookie,
    lastMutationIDChanges,
    patch: entities,
  }

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export { POST }

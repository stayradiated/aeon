import { z } from 'zod'

import type { RequestHandler } from './$types.js'

import { getDb } from '#lib/server/db/get-db.js'

import { poke } from '#lib/server/replicache/poke/poke.js'
import { importSnapshot } from '#lib/server/snapshot/import-snapshot.js'
import {
  $LegacySnapshot,
  migrateLegacySnapshot,
} from '#lib/server/snapshot/legacy-snapshot.js'
import { $Snapshot } from '#lib/server/snapshot/schema.js'

import { printError } from '#lib/utils/print-error.js'

const POST: RequestHandler = async (event) => {
  const { request, locals } = event

  const sessionUserId = locals.session?.userId
  if (!sessionUserId) {
    return new Response('Must be logged in', { status: 401 })
  }

  const requestBody: unknown = await request.json()

  const isLikelyLegacySnapshot =
    !!requestBody &&
    typeof requestBody === 'object' &&
    'user' in requestBody &&
    typeof requestBody.user === 'object' &&
    !Array.isArray(requestBody.user)

  const snapshot = isLikelyLegacySnapshot
    ? $LegacySnapshot.transform(migrateLegacySnapshot).safeParse(requestBody)
    : $Snapshot.safeParse(requestBody)

  if (snapshot.success === false) {
    return new Response(z.prettifyError(snapshot.error), { status: 400 })
  }

  const db = getDb()

  console.info('[import-snapshot] Importing workspace...')
  const result = await importSnapshot({
    db,
    userId: sessionUserId,
    snapshot: snapshot.data,
  })
  if (result instanceof Error) {
    console.error(printError(result))
    return new Response(result.message, { status: 500 })
  }
  console.info('[import-snapshot] Completed import of workspace.')

  poke(sessionUserId)

  return new Response('ok', { status: 200 })
}

export { POST }

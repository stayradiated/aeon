import type { RequestHandler } from './$types.js'

import { getDb } from '#lib/server/db/get-db.js'

import { exportSnapshot } from '#lib/server/snapshot/export-snapshot.js'

import { errorResponse } from '#lib/utils/http-error.js'

const GET: RequestHandler = async (event) => {
  const { locals } = event
  const sessionUserId = locals.session?.userId
  if (!sessionUserId) {
    return new Response('Must be logged in', { status: 401 })
  }

  const db = getDb()
  const snapshot = await exportSnapshot({
    db,
    userId: sessionUserId,
  })
  if (snapshot instanceof Error) {
    return errorResponse(500, snapshot)
  }

  const filename = `aeon-${Date.now()}.json`
  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/json',
    },
  })
}

export { GET }

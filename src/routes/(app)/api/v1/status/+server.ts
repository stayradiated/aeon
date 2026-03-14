import { error, json } from '@sveltejs/kit'

import type { RequestHandler } from './$types.js'

import { getDb } from '#lib/server/db/get-db.js'

import { getLabelList } from '#lib/server/db/label/get-label-list.js'
import { getActiveLineList } from '#lib/server/db/line/get-active-line-list.js'
import { getStreamList } from '#lib/server/db/stream/get-stream-list.js'

import {
  AuthenticationError,
  getApiSession,
} from '#lib/server/api-token/get-api-session.js'

import { errorResponse } from '#lib/utils/http-error.js'
import { promiseAllRecord } from '#lib/utils/promise-all-record.js'

type StatusItem = {
  streamName: string
  description: string
  startedAt: number
  labelList: string[]
}

const GET: RequestHandler = async (event) => {
  const { request } = event

  const db = getDb()

  const session = await getApiSession({ db, request })
  if (session instanceof AuthenticationError) {
    throw error(401, session.message)
  }
  if (session instanceof Error) {
    throw session
  }

  const { sessionUserId } = session

  const streamAndLineData = await promiseAllRecord({
    streamList: getStreamList({
      db,
      where: {
        userId: sessionUserId,
      },
    }),
    activeLineList: getActiveLineList({
      db,
      where: {
        userId: sessionUserId,
      },
    }),
  })
  if (streamAndLineData instanceof Error) {
    return errorResponse(500, streamAndLineData)
  }
  const { streamList, activeLineList } = streamAndLineData

  const labelIdList = activeLineList.flatMap((line) => {
    return line.labelIdList
  })
  const labelList = await getLabelList({
    db,
    where: {
      userId: sessionUserId,
      labelId: { in: labelIdList },
    },
  })
  if (labelList instanceof Error) {
    return errorResponse(500, labelList)
  }

  const status: StatusItem[] = activeLineList.map((line): StatusItem => {
    const stream = streamList.find((stream) => {
      return stream.id === line.streamId
    })

    const lineLabelList = labelList.flatMap((label) => {
      const isMatch = line.labelIdList.includes(label.id)
      if (!isMatch) {
        return []
      }
      return [label.icon, label.name].filter(Boolean).join(' ')
    })

    return {
      streamName: stream?.name ?? 'Unknown',
      description: line.description,
      startedAt: line.startedAt,
      labelList: lineLabelList,
    }
  })

  return json(status)
}

export { GET }

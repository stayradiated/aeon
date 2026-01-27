import type { MetaTaskId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'

import { updateMetaTask } from '#lib/server/db/meta-task/update-meta-task.js'
import { upsertMetaTask } from '#lib/server/db/meta-task/upsert-meta-task.js'

import { poke } from '#lib/server/replicache/poke/poke.js'

import { genId } from '#lib/utils/gen-id.js'

type MetaTaskOptions = {
  db: KyselyDb
  userId: UserId
  name: string
  status?: string
}

type MetaTaskResource = AsyncDisposable & {
  complete: (options?: { status?: string }) => Promise<void>
}

const trackMetaTask = async (
  options: MetaTaskOptions,
): Promise<MetaTaskResource> => {
  const { db, userId, name, status = 'Started' } = options

  let metaTaskId: MetaTaskId | undefined
  let isFinished = false

  const metaTask = await upsertMetaTask({
    db,
    where: {
      userId,
      name,
    },
    insert: {
      metaTaskId: genId(),
    },
    set: {
      status,
      lastStartedAt: Date.now(),
      lastFinishedAt: null,
    },
  })
  if (metaTask instanceof Error) {
    console.error(metaTask)
  } else {
    poke(userId)
    metaTaskId = metaTask.id
  }

  return {
    async [Symbol.asyncDispose]() {
      if (metaTaskId && !isFinished) {
        const updatedMetaTask = await updateMetaTask({
          db,
          where: {
            userId,
            metaTaskId,
          },
          set: {
            status: 'Error',
            lastFinishedAt: Date.now(),
          },
        })
        if (updatedMetaTask instanceof Error) {
          console.error(updatedMetaTask)
        } else {
          poke(userId)
        }
      }
    },
    complete: async (options = {}) => {
      const { status = 'Completed' } = options
      if (!metaTaskId) {
        return
      }
      if (isFinished) {
        return
      }
      isFinished = true
      const updatedMetaTask = await updateMetaTask({
        db,
        where: {
          userId,
          metaTaskId,
        },
        set: {
          status,
          lastFinishedAt: Date.now(),
        },
      })
      if (updatedMetaTask instanceof Error) {
        console.error(updatedMetaTask)
      } else {
        poke(userId)
      }
    },
  }
}

export { trackMetaTask }

import { PgBoss } from 'pg-boss'

import type { UserId } from '#lib/ids.js'

import { getDatabaseUrl } from '#lib/server/env.js'

import { getDb } from '#lib/server/db/get-db.js'

import { garbageCollectEmailVerification } from '#lib/server/db/email-verification/garabage-collect-email-verification'

import { fixupAllLabelParents } from '#lib/server/migrate/fixup-all-label-parents.js'
import { updateUserStatus } from '#lib/server/status/update-user-status.js'

import { once } from '#lib/utils/once.js'

const GC_EMAIL_VERIFICATION = 'garbage-collect-email-verification'
const FIXUP_LABEL_PARENTS = 'fixup-label-parents'
const UPDATE_USER_STATUS = 'update-user-status'

const getBoss = once(() => {
  const databaseUrl = getDatabaseUrl()
  const boss = new PgBoss(databaseUrl)
  return boss
})

const initBoss = async () => {
  const boss = getBoss()

  console.info('[worker] Starting boss…')
  await boss.start()

  await boss.createQueue(GC_EMAIL_VERIFICATION)
  await boss.work(GC_EMAIL_VERIFICATION, async (_info) => {
    console.info('[worker] Garbage collecting email verifications…')
    const db = getDb()
    await garbageCollectEmailVerification({ db })
  })

  await boss.createQueue(FIXUP_LABEL_PARENTS, { policy: 'stately' })
  await boss.work<{ userId: UserId }>(FIXUP_LABEL_PARENTS, async (jobs) => {
    console.info('[worker] Fixing up label parents…')
    const db = getDb()
    for (const job of jobs) {
      const result = await fixupAllLabelParents({
        db,
        userId: job.data.userId,
      })
      if (result instanceof Error) {
        throw result
      }
    }
  })

  await boss.createQueue(UPDATE_USER_STATUS, { policy: 'stately' })
  await boss.work<{ userId: UserId }>(UPDATE_USER_STATUS, async (jobs) => {
    console.info('[worker] Syncing user status…')
    const db = getDb()
    for (const job of jobs) {
      const result = await updateUserStatus({
        db,
        userId: job.data.userId,
      })
      if (result instanceof Error) {
        throw result
      }
    }
  })

  await boss.schedule(GC_EMAIL_VERIFICATION, '0 0 * * *')

  return async () => {
    console.info('[worker] Stopping boss…')
    await boss.stop()
  }
}

const scheduleFixupLabelParents = async (options: { userId: UserId }) => {
  const { userId } = options
  const boss = getBoss()
  await boss.send(
    FIXUP_LABEL_PARENTS,
    { userId },
    {
      singletonKey: userId,
    },
  )
}

const scheduleUpdateUserStatus = async (options: { userId: UserId }) => {
  const { userId } = options
  const boss = getBoss()
  await boss.send(
    UPDATE_USER_STATUS,
    { userId },
    {
      singletonKey: userId,
    },
  )
}

export { initBoss, scheduleFixupLabelParents, scheduleUpdateUserStatus }

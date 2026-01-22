import { PgBoss } from 'pg-boss'

import { getDatabaseUrl } from '#lib/server/env.js'

import { getDb } from '#lib/server/db/get-db.js'

import { garbageCollectEmailVerification } from '#lib/server/db/email-verification/garabage-collect-email-verification'

import { once } from '#lib/utils/once.js'

const GC_EMAIL_VERIFICATION = 'garbage-collect-email-verification'

const getBoss = once(() => {
  const databaseUrl = getDatabaseUrl()
  const boss = new PgBoss(databaseUrl)
  return boss
})

const initBoss = () => {
  const boss = getBoss()

  void (async () => {
    console.info('[worker] Starting boss…')
    await boss.start()
    await boss.createQueue(GC_EMAIL_VERIFICATION)

    await boss.work(GC_EMAIL_VERIFICATION, async (_info) => {
      console.info('[worker] Garbage collecting email verifications…')
      const db = getDb()
      await garbageCollectEmailVerification({ db })
    })

    await boss.schedule(GC_EMAIL_VERIFICATION, '0 0 * * *')
  })().catch((error) => {
    console.error('[worker] Failed to start worker', error)
  })

  return async () => {
    console.info('[worker] Stopping boss…')
    await boss.offWork('garbage-collect-email-verification')
  }
}

export { getBoss, initBoss }

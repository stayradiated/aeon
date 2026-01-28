import { createFactory } from 'test-fixture-factory'

import type { KyselyDb } from '$lib/server/db/types.js'

import { getDb } from '$lib/server/db/get-db.js'

const dbFactory = createFactory<KyselyDb>('Db').fixture(async (_attrs, use) => {
  const db = getDb()

  // we start a transaction
  const transaction = await db.startTransaction().execute()

  await use(transaction)

  // and cleanup by rolling back the transaction
  await transaction.rollback().execute()
})

const useDb = dbFactory.useValue
const useCreateDb = dbFactory.useCreateValue

export { useDb, useCreateDb }

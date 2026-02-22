import { assertOk } from '@stayradiated/error-boundary'
import { createFactory } from 'test-fixture-factory'

import type { KyselyDb } from '#lib/server/db/types.js'
import type { User } from '#lib/server/types.js'

import { insertUser } from '#lib/server/db/user/insert-user.js'

import { genId } from '#lib/utils/gen-id.js'

const userFactory = createFactory<User>('User')
  .withContext<{
    db: KyselyDb
  }>()
  .withSchema((f) => ({
    db: f.type<KyselyDb>().from('db'),
    email: f
      .type<string>()
      .default(() => `test.${genId().toLowerCase()}@example.com`),
  }))
  .fixture(async (attrs, use) => {
    const { db, email } = attrs

    const user = await insertUser({
      db,
      set: {
        id: genId(),
        email,
        stravaClientId: null,
        stravaClientSecret: null,
        stravaSession: null,
        slackToken: null,
      },
    })
    assertOk(user)

    await use(user)
  })

const useCreateUser = userFactory.useCreateValue
const useUser = userFactory.useValue

export {
  /** @knipignore **/
  useCreateUser,
  useUser,
}

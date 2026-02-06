import type { Store } from '#lib/core/replicache/store.js'
import type { UserId } from '#lib/ids.js'
import type { ScenarioName } from './scenario.js'

import { createStore } from '#lib/core/replicache/store.js'

import { genId } from '#lib/utils/gen-id.js'

import { getFaker } from './faker.js'
import { mockReplicache } from './mock-replicache.js'
import { generateScenarioData } from './scenario.js'

type CreateMockStoreOptions = {
  scenario: ScenarioName
  seed?: string
}

const createMockStore = async (
  options: CreateMockStoreOptions,
): Promise<Store> => {
  const { scenario, seed } = options

  const sessionUserId = genId<UserId>()

  const rep = await mockReplicache({
    sessionUserId,
  })

  const store = createStore({
    rep,
    sessionUserId,
  })

  // Create a fake generator for the scenario
  const faker = getFaker(seed)

  // Use mutators to create scenario-specific data
  await generateScenarioData({ store, scenario, faker })

  return store
}

export { createMockStore }

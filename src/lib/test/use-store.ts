import { createFactory } from 'test-fixture-factory'

import type { Store } from '#lib/core/replicache/store.js'
import type { ScenarioName } from '#lib/test/seed/scenario.js'

import { createMockStore } from '#lib/test/seed/mock-store.js'

const repFactory = createFactory<Store>('Store')
  .withSchema((f) => ({
    scenario: f.type<ScenarioName>().default('minimal'),
    seed: f.type<string>().optional(),
  }))
  .fixture(async (attrs, use) => {
    const { scenario, seed } = attrs

    // we need a fresh store for each test
    const store = await createMockStore({ scenario, seed })

    await use(store)
  })

const useStore = repFactory.useValue

export { useStore }

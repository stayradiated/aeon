import type { Store } from '#lib/core/replicache/store.js'
import type { Faker } from './faker.js'

import { generateBasicScenario } from './scenario-basic.js'

type ScenarioName = 'minimal' | 'basic'

type GenerateScenarioDataOptions = {
  scenario: ScenarioName
  store: Store
  faker: Faker
}

/**
 * Generate data based on the selected scenario
 */
const generateScenarioData = async (options: GenerateScenarioDataOptions) => {
  const { store, scenario, faker } = options

  switch (scenario) {
    case 'minimal': {
      // literally nothing to do for minimal scenario
      break
    }
    case 'basic': {
      await generateBasicScenario({ store, faker })
      break
    }
    default: {
      scenario satisfies never
      throw new Error(`Unknown scenario: ${scenario}`)
    }
  }
}

export type { ScenarioName }

export { generateScenarioData }

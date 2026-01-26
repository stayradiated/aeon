import type { MutatorKey, ServerMutator } from '#lib/mutator/types.js'

import { memoize } from '#lib/utils/memoize.js'

import { mutators } from '#lib/mutator/index.server.js'

// TODO: return a typed server mutator
// biome-ignore lint/suspicious/noExplicitAny: temporary type for dynamic mutator loading
type AnyServerMutator = ServerMutator<any>

// TODO: use zod to validate the mutator arguments
const getMutator = memoize(
  async (mutatorName: string): Promise<AnyServerMutator | undefined> => {
    const mutator = await mutators[mutatorName as MutatorKey]
    return mutator?.default
  },
  {
    cacheKey: ([mutatorName]) => mutatorName,
  },
)

export { getMutator }

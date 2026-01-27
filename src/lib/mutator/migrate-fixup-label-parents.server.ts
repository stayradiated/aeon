import type { ServerMutator } from './types.ts'

import { scheduleFixupLabelParents } from '#lib/server/worker.js'

const migrateFixuplabelParents: ServerMutator<
  'migrate_fixupLabelParents'
> = async (context) => {
  const { sessionUserId } = context

  await scheduleFixupLabelParents({ userId: sessionUserId })
}

export default migrateFixuplabelParents

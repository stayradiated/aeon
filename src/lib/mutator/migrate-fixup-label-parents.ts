import type { LocalMutator } from './types.js'

const migrateFixupLabelParents: LocalMutator<
  'migrate_fixupLabelParents'
> = async (_context, _options) => {
  console.warn('migrateFixupLabelParents is not implemented locally')
}

export default migrateFixupLabelParents

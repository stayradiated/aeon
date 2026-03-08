import type { LocalMutator } from './types.js'

const dangerDeleteAllData: LocalMutator<'danger_deleteAllData'> = async (
  _context,
  options,
) => {
  const { userHasConfirmed } = options

  if (!userHasConfirmed) {
    throw new Error('User has not confirmed deletion')
  }
}

export default dangerDeleteAllData

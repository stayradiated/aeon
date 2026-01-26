import type { Signal } from 'signia'
import { computed } from 'signia'

import { createSelector } from '#lib/utils/selector.js'

const getUserTimeZone = createSelector(
  'getUserTimeZone',
  (store): Signal<string> => {
    const $user = store.user.get(store.sessionUserId)
    return computed('getUserTimeZone', () => {
      const user = $user.value
      return user ? user.timeZone : 'UTC'
    })
  },
)

export { getUserTimeZone }

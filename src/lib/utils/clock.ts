import * as dateFns from 'date-fns'
import { atom, computed } from 'signia'

const clockSec = atom('clock', Date.now())

setInterval(() => {
  clockSec.set(Date.now())
}, 1000)

const clockMin = computed('clockMinute', () => {
  return dateFns
    .roundToNearestMinutes(clockSec.value, { roundingMethod: 'floor' })
    .getTime()
})

export { clockSec, clockMin }

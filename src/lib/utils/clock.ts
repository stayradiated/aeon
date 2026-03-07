import * as dateFns from 'date-fns'
import { atom, computed } from 'signia'

const clock = atom('clock', Date.now())

setInterval(() => {
  clock.set(Date.now())
}, 1000)

const clockMinute = computed('clockMinute', () => {
  return dateFns
    .roundToNearestMinutes(clock.value, { roundingMethod: 'floor' })
    .getTime()
})

export { clock, clockMinute }

import { atom } from 'signia'

const clock = atom('clock', Date.now())

setInterval(() => {
  clock.set(Date.now())
}, 1000)

export { clock }

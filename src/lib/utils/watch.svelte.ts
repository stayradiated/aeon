import type { Signal } from 'signia'
import { react } from 'signia'

type WatchFn = {
  <T>(signal: Signal<T>): WatchProxy<T>
  undefined: WatchProxy<undefined>
}

type WatchProxy<T> = {
  _: T
}

const watch: WatchFn = (signal) => {
  let state = $state.raw(signal.value)

  $effect(() => {
    const unsubscribe = react(`watch(${signal.name})`, () => {
      state = signal.value
    })
    return unsubscribe
  })

  return {
    get _() {
      return state
    },
  }
}
watch.undefined = { _: undefined }

export { watch }

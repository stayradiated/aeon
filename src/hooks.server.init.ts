import { styleText } from 'node:util'

import { initBoss } from '#lib/server/worker.js'

import {
  exposeConfigureServerGlobal,
  startWebsocketServer,
} from '#lib/server/websocket/websocket-server.js'

const serverStateKey = '__hooks.server.init.ts__'

type GlobalState<T> = {
  [serverStateKey]: T
}

const getInitState = <T>(): T | undefined => {
  return (global as unknown as GlobalState<T>)[serverStateKey]
}

const setInitState = <T>(state: T) => {
  ;(global as unknown as GlobalState<T>)[serverStateKey] = state
}

type TeardownFn = () => Promise<void>

type SetupFn = () => Promise<TeardownFn>

const createHandler = (fn: SetupFn) => {
  return async () => {
    const initState = getInitState<TeardownFn>()
    if (initState) {
      console.info(styleText('red', '[hooks.server.init] Stopping server…'))
      try {
        await initState()
      } catch {
        console.info(styleText('red', '[hooks.server.init] Server stop failed'))
      } finally {
        console.info(styleText('red', '[hooks.server.init] Server stopped'))
      }
    }
    console.info(styleText('green', '[hooks.server.init] Starting server…'))
    setInitState(await fn())
    console.info(styleText('green', '[hooks.server.init] Server is ready'))
  }
}

const onInit = createHandler(async () => {
  const teardownList: TeardownFn[] = []

  teardownList.push(await initBoss())
  teardownList.push(startWebsocketServer())

  return async () => {
    for (const teardown of teardownList) {
      await teardown()
    }
  }
})

// side-effect: exposes configureServer global
// this is required when running the server in production mode
// (i.e. started by `node ./prod-server.js`)
exposeConfigureServerGlobal()

export { onInit }

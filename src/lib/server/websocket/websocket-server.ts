import type { IncomingMessage } from 'node:http'
import { promisify, styleText } from 'node:util'
import cookie from 'cookie'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'

import type { UserId } from '#lib/ids.js'

import * as auth from '#lib/server/auth.js'

import { getDb } from '#lib/server/db/get-db.js'

import { getRoutes } from './get-routes.js'
import { setConfigureServer } from './global-state.js'
import { createConfigureServerFn } from './http-server-hooks.js'

type HandleWebsocket = (event: {
  socket: WebSocket
  sessionUserId: UserId
  request: { url: Readonly<URL> }
}) => Promise<void>

const handleWebsocket: HandleWebsocket = async (event) => {
  const { socket, sessionUserId, request } = event
  const { url } = request
  const { pathname } = url

  const routeList = await getRoutes()
  for (const route of routeList) {
    const [isMatch, params] = route.match(pathname)
    if (isMatch) {
      return route.handler({
        socket,
        params,
        sessionUserId,
        url,
      })
    }
  }

  console.error(
    styleText('red', `[wss:kit] No websocket handler found for: "${pathname}"`),
  )

  return undefined
}

type TeardownFn = () => Promise<void>

const getSessionUserId = async (
  request: IncomingMessage,
): Promise<UserId | undefined> => {
  const token = cookie.parse(request.headers.cookie ?? '')[
    auth.SESSION_COOKIE_NAME
  ]
  if (!token) {
    return undefined
  }

  const db = getDb()
  const result = await auth.validateSessionToken(db, token)
  if (result instanceof Error) {
    console.error('Error validating session token:', result)
    return undefined
  }
  const { session } = result

  return session?.userId
}

const state: {
  wss: WebSocketServer | undefined
} = {
  wss: undefined,
}

const startWebsocketServer = (): TeardownFn => {
  const wss = new WebSocketServer({ noServer: true })

  // update the current websocket server
  state.wss = wss

  wss.on('connection', async (ws, request) => {
    const sessionUserId = await getSessionUserId(request)
    if (!sessionUserId) {
      console.warn(
        styleText(
          'yellow',
          '[wss:kit] Unauthorized WebSocket connection attempt',
        ),
      )
      ws.close(1008, 'Unauthorized')
      return
    }

    const origin = 'ws://websockets'
    const url = new URL(`${origin}${request.url}`)

    await handleWebsocket({
      socket: ws,
      sessionUserId,
      request: {
        url,
      },
    })
  })

  return async () => {
    // teardown the current websocket server
    state.wss = undefined

    console.warn(styleText('red', '[wss:kit] Stopping WebSocket Server…'))
    const closeFn = promisify(wss.close.bind(wss))
    await closeFn()
    console.warn(styleText('red', '[wss:kit] WebSocket Server stopped'))
  }
}

/*
 * hack to allow our `./prod-server.js` script to access the websocket server
 */
const exposeConfigureServerGlobal = () => {
  setConfigureServer(createConfigureServerFn(() => state.wss))
}

export { exposeConfigureServerGlobal, startWebsocketServer }

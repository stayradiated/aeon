import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { styleText } from 'node:util'
import type { HttpServer } from 'vite'
import type { WebSocketServer } from 'ws'

type WssGetter = () => WebSocketServer | undefined

const createHttpServerUpgradeHandler =
  (getWss: WssGetter) =>
  (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    // Only handle upgrades for paths that start with '/websocket'
    if (!request.url?.startsWith('/websocket')) {
      console.warn(styleText('red', `[wss:kit] ignoring: ${request.url}`))
      return
    }

    const wss = getWss()
    if (!wss) {
      console.error(
        styleText(
          'red',
          `[wss:kit] WebSocket server is not initialized. Cannot handle upgrade for: ${request.url}`,
        ),
      )
      return
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  }

const createConfigureServerFn =
  (getWss: WssGetter) => (httpServer: HttpServer) => {
    const handler = createHttpServerUpgradeHandler(getWss)

    if (!httpServer.listeners('upgrade').includes(handler)) {
      httpServer.on('upgrade', handler)
    }
  }

export { createConfigureServerFn }

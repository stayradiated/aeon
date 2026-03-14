import type { PluginOption } from 'vite'

import { getConfigureServer } from './global-state.ts'

/*
 * This is a Vite plugin that sets up an integrated websocket server.
 * NOTE: This file is only used in development mode.
 * (or when running with `vite preview`)
 *
 * see:
 *   - vite.config.ts for usage
 *   - prod-server.js for the production server entry point
 *   - ./websocket-server.ts for the websocket server implementation
 *   - ./http-server-hooks.ts for the HTTP Server hooks
 *   - ./global-state.ts for how global state is handled
 */

const websocket = (): PluginOption => ({
  name: 'integratedWebsocketServer',
  configureServer(server) {
    if (server.httpServer) {
      const { httpServer } = server
      void getConfigureServer({ timeoutMs: 10000 })
        .then((configureServer) => {
          configureServer(httpServer)
        })
        .catch((e) => {
          console.error('[vite-websocket-server] Error configuring server', e)
        })
    }
  },
  async configurePreviewServer(server) {
    void getConfigureServer({ timeoutMs: 10000 })
      .then((configureServer) => {
        configureServer(server.httpServer)
      })
      .catch((e) => {
        console.error('[vite-websocket-server] Error configuring server', e)
      })
  },
})

export { websocket }

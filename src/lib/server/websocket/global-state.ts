import type { HttpServer } from 'vite'

import { defineGlobalVariable } from '../../utils/define-global-variable.ts'

/*
 * IMPORTANT:
 * This symbol must match `/prod-server.js`.
 * It's a way for that script to access this function without having to figure
 * out how to import it.
 */
const GlobalThisConfigureServer = Symbol.for('rough:websocket:configureServer')

type ConfigureServer = (httpServer: HttpServer) => void

// Create the getter and setter using the utility
const [getConfigureServer, setConfigureServer] =
  defineGlobalVariable<ConfigureServer>(GlobalThisConfigureServer)

export type { ConfigureServer }

export { getConfigureServer, setConfigureServer }

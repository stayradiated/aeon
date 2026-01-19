#!/usr/bin/env node

/**
 * Production server entry point for Rough.app
 */

import { server } from './build/index.js'

// Configure WebSocket Server
globalThis[Symbol.for('rough:websocket:configureServer')](server.server)

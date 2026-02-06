import type { WebSocket } from 'ws'

import type { UserId } from '#lib/ids.js'

type Params = Record<string, string>

type WebsocketHandlerFn = (event: {
  socket: WebSocket
  params: Params
  sessionUserId: UserId
  url: Readonly<URL>
}) => Promise<void>

type MatchResult = [true, Params] | [false, undefined]
type MatchFn = (pathname: string) => MatchResult

type WebsocketHandler = {
  match: MatchFn
  handler: WebsocketHandlerFn
}

/**
 * Creates a match function from a route pattern
 * Pattern: /websocket/workspace/[workspaceId]/canvas/[canvasId]
 * Matches: /websocket/workspace/abc123/canvas/xyz789
 * Returns: { workspaceId: 'abc123', canvasId: 'xyz789' }
 */
const createMatchFn = (routePattern: string): MatchFn => {
  // Extract parameter names from the pattern
  const paramNames: string[] = []
  const regexPattern = routePattern
    .replace(/\[([^\]]+)\]/g, (_match, paramName) => {
      paramNames.push(paramName)
      return '([^/]+)' // Capture any non-slash characters
    })
    .replace(/\//g, '\\/') // Escape forward slashes for regex

  // Create the regex with start and end anchors
  const regex = new RegExp(`^${regexPattern}$`)

  return (pathname: string): MatchResult => {
    const matchResult = regex.exec(pathname)

    if (!matchResult) {
      return [false, undefined]
    }

    // Extract captured groups and map to parameter names
    const params: Params = {}
    paramNames.forEach((name, index) => {
      // matchResult[0] is the full match, params start at index 1
      const value = matchResult[index + 1]
      if (typeof value === 'string') {
        params[name] = value
      }
    })

    return [true, params]
  }
}

const defineWebsocketHandler = (
  filePath: string,
  handler: WebsocketHandlerFn,
): WebsocketHandler => {
  return {
    match: createMatchFn(filePath),
    handler,
  }
}

export { defineWebsocketHandler }
export type { WebsocketHandler, WebsocketHandlerFn }

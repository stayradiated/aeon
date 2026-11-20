import { version } from '$app/env'
import { assets, immutable } from '$app/manifest'
import { asset } from '$app/paths'
import { self } from '$app/service-worker'

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`

const ASSETS = [
  ...immutable.map(({ path }) => `/${path}`),
  ...assets.map(({ path }) => asset(path)),

  '/',
  '/add',
  '/label',
  '/log',
  '/settings',
]

self.addEventListener('install', (event) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    const cache = await caches.open(CACHE)
    await cache.addAll(ASSETS)
  }

  event.waitUntil(addFilesToCache())
})

self.addEventListener('message', (event) => {
  // This lets the page tell the waiting worker to activate now (after the user
  // clicks “Update”).
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting())
  }
})

self.addEventListener('activate', (event) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) {
        await caches.delete(key)
      }
    }

    // claim clients immediately after activation (so the new SW controls open
    // pages without requiring a second reload/navigation):
    await self.clients.claim()
  }

  event.waitUntil(deleteOldCaches())
})

self.addEventListener('fetch', (event) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') {
    return
  }

  const respond = async () => {
    const url = new URL(event.request.url)
    const cache = await caches.open(CACHE)

    // `build`/`files` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(url.pathname)
      if (response) {
        return response
      }
    }

    // api requests must always be served from the network
    if (url.pathname.startsWith('/api')) {
      return fetch(event.request)
    }

    // for everything else, try the network first, but
    // fall back to the cache if we're offline
    try {
      const response = await fetch(event.request)

      if (!(response instanceof Response)) {
        throw new Error('invalid response from fetch')
      }

      if (response.status === 200) {
        event.waitUntil(cache.put(event.request, response.clone()))
      }

      return response
    } catch (error) {
      const response = await cache.match(event.request)

      if (response) {
        return response
      }

      throw error
    }
  }

  event.respondWith(respond())
})

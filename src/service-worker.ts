// Disables access to DOM typings like `HTMLElement` which are not available
// inside a service worker and instantiates the correct globals
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Ensures that the `$service-worker` import has proper type definitions
/// <reference types="@sveltejs/kit" />

// Only necessary if you have an import from `$env/static/public`
/// <reference types="../.svelte-kit/ambient.d.ts" />

import * as sw from '$service-worker'

// This gives `self` the correct types
const self = globalThis.self as unknown as ServiceWorkerGlobalScope

// Create a unique cache name for this deployment
const CACHE = `cache-${sw.version}`

const ASSETS = [
  ...sw.build, // the app itself
  ...sw.files, // everything in `static`

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
    self.skipWaiting()
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
        cache.put(event.request, response.clone())
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

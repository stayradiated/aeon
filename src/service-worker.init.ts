const registerServiceWorker = async (
  onUpdateAvailable: (update: () => void) => void,
) => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registration =
    await navigator.serviceWorker.register('/service-worker.js')

  // Ensure we check periodically (useful for long-lived tabs)
  // You can also hook this to visibilitychange.
  setInterval(() => registration.update(), 60_000)

  registration.onupdatefound = () => {
    const newWorker = registration.installing
    if (!newWorker) {
      return
    }

    newWorker.onstatechange = () => {
      // "installed" means: installed into cache, but may be waiting
      if (newWorker.state === 'installed') {
        // If there's an existing controller, this is an update (not first install)
        if (navigator.serviceWorker.controller) {
          const doUpdate = () => {
            // Tell the waiting SW to activate now
            registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
          }

          onUpdateAvailable(doUpdate)
        }
      }
    }
  }

  // When the new SW takes control, reload so the new assets/routes are used
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

export { registerServiceWorker }

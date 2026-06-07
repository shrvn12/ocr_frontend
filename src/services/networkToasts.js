import { useToast } from 'vue-toastification'

const OFFLINE_NOTICE_DELAY = 4000
const UNSTABLE_WINDOW = 20000
const UNSTABLE_CHANGE_COUNT = 4
const TOAST_COOLDOWN = 60000
const RESTORED_COOLDOWN = 20000

let started = false
let offlineTimer = null
let lastToastAt = 0
let lastOfflineAt = 0
let lastRestoredAt = 0
let wasOfflineNotified = false
const networkChanges = []

function canShow(lastShownAt, cooldown = TOAST_COOLDOWN) {
  return Date.now() - lastShownAt > cooldown
}

function markNetworkChange() {
  const now = Date.now()
  networkChanges.push(now)

  while (networkChanges.length && now - networkChanges[0] > UNSTABLE_WINDOW) {
    networkChanges.shift()
  }

  return networkChanges.length >= UNSTABLE_CHANGE_COUNT
}

function hasWeakConnection() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return false

  const effectiveType = connection.effectiveType || ''
  const downlink = Number(connection.downlink)
  const rtt = Number(connection.rtt)

  return (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    (Number.isFinite(downlink) && downlink > 0 && downlink < 0.5) ||
    (Number.isFinite(rtt) && rtt > 1500)
  )
}

export function startNetworkToasts() {
  if (started || typeof window === 'undefined') return
  started = true

  const toast = useToast()

  function showSubtleWarning(message) {
    if (!canShow(lastToastAt)) return
    lastToastAt = Date.now()
    toast.warning(message, {
      timeout: 4500,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
    })
  }

  function showOfflineWarning() {
    if (!canShow(lastOfflineAt)) return
    lastOfflineAt = Date.now()
    toast.warning('Connection lost. Uploads will resume when you are back online.', {
      timeout: 4500,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
    })
  }

  function notifyOfflineIfSustained() {
    clearTimeout(offlineTimer)
    offlineTimer = setTimeout(() => {
      if (!navigator.onLine) {
        wasOfflineNotified = true
        showOfflineWarning()
      }
    }, OFFLINE_NOTICE_DELAY)
  }

  function handleNetworkChange() {
    const isUnstable = markNetworkChange()

    if (!navigator.onLine) {
      notifyOfflineIfSustained()
      return
    }

    clearTimeout(offlineTimer)

    if (wasOfflineNotified && canShow(lastRestoredAt, RESTORED_COOLDOWN)) {
      lastRestoredAt = Date.now()
      wasOfflineNotified = false
      toast.info('Connection restored.', {
        timeout: 3000,
        pauseOnHover: false,
        draggable: false,
      })
      return
    }

    if (isUnstable) {
      showSubtleWarning('Network looks unstable. Uploads may pause and resume.')
      return
    }

    if (hasWeakConnection()) {
      showSubtleWarning('Connection is weak. Uploads may take longer.')
    }
  }

  window.addEventListener('online', handleNetworkChange)
  window.addEventListener('offline', handleNetworkChange)

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  connection?.addEventListener?.('change', handleNetworkChange)

  if (!navigator.onLine) {
    notifyOfflineIfSustained()
  } else if (hasWeakConnection()) {
    setTimeout(() => showSubtleWarning('Connection is weak. Uploads may take longer.'), 2000)
  }
}

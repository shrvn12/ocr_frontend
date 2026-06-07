import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
// import { useToast } from '../composables/useToast'
import { useToast } from "vue-toastification";

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
// Stores raw File blobs so they survive page refreshes while offline.
// Queue metadata (name, size, status…) is kept in localStorage separately.

const IDB_NAME    = 'ocr_offline_queue'
const IDB_STORE   = 'files'
const LS_QUEUE_KEY = 'ocr_upload_queue_meta'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(IDB_STORE)
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror   = ()  => reject(req.error)
  })
}

async function idbSave(id, file) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(file, id)
    tx.oncomplete = resolve
    tx.onerror    = () => reject(tx.error)
  })
}

async function idbGet(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror   = () => reject(req.error)
  })
}

async function idbDelete(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(id)
    tx.oncomplete = resolve
    tx.onerror    = () => reject(tx.error)
  })
}

async function idbGetAllKeys() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).getAllKeys()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

// ─── Queue metadata persistence ───────────────────────────────────────────────
// We save queue item metadata (everything except the File blob) to localStorage
// so the queue UI can be restored after a page refresh even before IDB is read.

function saveQueueMeta(queue) {
  const meta = queue.map(({ id, name, size, status, progress, error }) => ({
    id, name, size, status: status === 'uploading' ? 'queued' : status, progress, error,
    // status reset: if page closed mid-upload, treat as queued again
  }))
  localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(meta))
}

function loadQueueMeta() {
  try {
    return JSON.parse(localStorage.getItem(LS_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = defineStore('app', () => {
  const toast = useToast()
  const user      = ref(JSON.parse(localStorage.getItem('ocr_user') || 'null'))
  const documents = ref([])
  const loading   = ref(false)
  const error     = ref(null)

  // Rehydrate queue metadata from localStorage on load.
  // File blobs are fetched lazily from IndexedDB when processQueue runs.
  const uploadQueue = ref(
    loadQueueMeta().map(m => ({ ...m, file: null }))
  )

  const isAuthenticated = computed(() => !!user.value)

  const stats = computed(() => ({
    total:          documents.value.length,
    pending_ocr:    documents.value.filter(d => d.status === 'OCR_PROCESSING' || d.status === 'UPLOADED').length,
    pending_review: documents.value.filter(d => d.status === 'READY_FOR_REVIEW').length,
    approved:       documents.value.filter(d => d.status === 'APPROVED').length,
    rejected:       documents.value.filter(d => d.status === 'REJECTED').length,
  }))

  const roleMap = {
    UPLOADER: 'field_operator',
    REVIEWER: 'reviewer',
    ADMIN:    'admin',
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  async function login(email, password) {
    loading.value = true
    error.value   = null
    try {
      const response = await api.login(email, password)
      const { user: userData, tokens } = response.data

      const frontendUser = {
        id:           userData.id,
        name:         userData.name,
        email:        userData.email,
        role:         roleMap[userData.role] || 'field_operator',
        apiRole:      userData.role,
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn:    tokens.expiresIn,
      }

      user.value = frontendUser
      localStorage.setItem('ocr_user', JSON.stringify(frontendUser))
      // toast.success('Login successful!')
      return true
    } catch (err) {
      error.value = err.message
      toast.error(err.message)
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(name, email, password, role = 'UPLOADER') {
    loading.value = true
    error.value   = null
    try {
      const response = await api.register(name, email, password, role)
      const { user: userData, tokens } = response.data

      const frontendUser = {
        id:           userData.id,
        name:         userData.name,
        email:        userData.email,
        role:         roleMap[role] || 'field_operator',
        apiRole:      role,
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn:    tokens.expiresIn,
      }

      user.value = frontendUser
      localStorage.setItem('ocr_user', JSON.stringify(frontendUser))
      toast.success('Account created successfully!')
      return true
    } catch (err) {
      error.value = err.message
      toast.error(err.message)
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value      = null
    documents.value = []
    localStorage.removeItem('ocr_user')
    toast.info('Logged out successfully')
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  async function fetchDocuments(page = 1, limit = 20, status = null) {
    loading.value = true
    error.value   = null
    try {
      const response  = await api.listDocuments(page, limit, status)
      documents.value = response.data
      return response
    } catch (err) {
      error.value = err.message
      if(err.message !== "No token provided."){
        toast.error(err.message)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  async function getDocument(id) {
    loading.value = true
    error.value   = null
    try {
      const response = await api.getDocument(id)
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  // ── Upload queue ───────────────────────────────────────────────────────────

  async function uploadDocument(file) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const queueItem = {
      id,
      name:     file.name,
      size:     file.size,
      status:   'queued',
      progress: 0,
      error:    null,
      file,      // in-memory reference
    }

    uploadQueue.value.push(queueItem)

    // Always persist blob to IDB immediately so it survives page refresh
    await idbSave(id, file)
    saveQueueMeta(uploadQueue.value)

    return id
  }

  async function processQueue() {
    for (const item of uploadQueue.value) {
      if (item.status !== 'queued') continue

      // ── Offline: file is already in IDB, nothing else to do ───────────────
      if (!navigator.onLine) {
        toast.info(`${item.name} is saved offline and will upload when reconnected.`)
        continue
      }

      // ── Restore blob from IDB if File reference was lost (page refresh) ───
      if (!item.file) {
        item.file = await idbGet(item.id)
        if (!item.file) {
          item.status = 'error'
          item.error  = 'File missing from storage. Please re-add it.'
          saveQueueMeta(uploadQueue.value)
          toast.error(`${item.name}: ${item.error}`)
          continue
        }
      }

      // ── Upload ─────────────────────────────────────────────────────────────
      item.status   = 'uploading'
      item.progress = 0
      saveQueueMeta(uploadQueue.value)

      const progressInterval = setInterval(() => {
        if (item.progress < 90) item.progress += Math.random() * 30
      }, 300)

      try {
        const response = await api.uploadDocument(item.file)

        clearInterval(progressInterval)
        item.progress = 100
        item.status   = 'done'
        item.result   = response.data
        item.file     = null  // release memory

        // Blob uploaded — safe to remove from IDB
        await idbDelete(item.id)
        saveQueueMeta(uploadQueue.value)

        toast.success(`${item.name} uploaded successfully!`)
        await fetchDocuments()

      } catch (err) {
        clearInterval(progressInterval)

        // Went offline mid-upload: keep blob in IDB, reset to queued
        if (!navigator.onLine) {
          item.status   = 'queued'
          item.progress = 0
          saveQueueMeta(uploadQueue.value)
          toast.info(`${item.name} paused — will retry when reconnected.`)
        } else {
          item.status = 'error'
          item.error  = err.message
          saveQueueMeta(uploadQueue.value)
          toast.error(`Upload failed: ${err.message}`)
        }
      }
    }
  }

  function removeFromQueue(id) {
    idbDelete(id)  // clean up IDB blob
    uploadQueue.value = uploadQueue.value.filter(i => i.id !== id)
    saveQueueMeta(uploadQueue.value)
  }

  // ── Restore IDB queue on app init ──────────────────────────────────────────
  // Called once when the store initialises. Checks if any IDB blobs exist for
  // queue items that came back from localStorage — confirms the file is still
  // there and marks items ready.  Orphaned IDB entries (no matching meta) are
  // cleaned up automatically.
  async function restoreOfflineQueue() {
    const idbKeys     = await idbGetAllKeys()
    const queueIds    = new Set(uploadQueue.value.map(i => i.id))

    // Remove IDB blobs with no matching queue entry (leftover from old sessions)
    for (const key of idbKeys) {
      if (!queueIds.has(key)) await idbDelete(key)
    }

    // If there are queued items and we're online, process them immediately
    const hasQueued = uploadQueue.value.some(i => i.status === 'queued')
    if (hasQueued && navigator.onLine) {
      toast.info('Resuming offline uploads…')
      await processQueue()
    }
  }

  // ── Auto-resume when connection returns ────────────────────────────────────
  window.addEventListener('online', async () => {
    const hasQueued = uploadQueue.value.some(i => i.status === 'queued')
    if (hasQueued) {
      toast.info('Back online — resuming uploads…')
      await processQueue()
    }
  })

  // Run restore on store init
  restoreOfflineQueue()

  // ── Review actions ─────────────────────────────────────────────────────────

  async function approveDocument(documentId, notes = '') {
    loading.value = true
    error.value   = null
    try {
      const response = await api.approveDocument(documentId, notes)
      await fetchDocuments()
      toast.success('Document approved successfully!')
      return response
    } catch (err) {
      error.value = err.message
      toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function rejectDocument(documentId, notes = '') {
    loading.value = true
    error.value   = null
    try {
      const response = await api.rejectDocument(documentId, notes)
      await fetchDocuments()
      toast.success('Document rejected successfully!')
      return response
    } catch (err) {
      error.value = err.message
      toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateDocumentField(documentId, fieldName, correctedValue) {
    loading.value = true
    error.value   = null
    try {
      const response = await api.correctField(documentId, fieldName, correctedValue)
      toast.success('Field updated successfully!')
      return response
    } catch (err) {
      error.value = err.message
      toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    documents,
    uploadQueue,
    loading,
    error,
    isAuthenticated,
    stats,
    login,
    register,
    logout,
    fetchDocuments,
    getDocument,
    uploadDocument,
    processQueue,
    removeFromQueue,
    approveDocument,
    rejectDocument,
    updateDocumentField,
  }
})
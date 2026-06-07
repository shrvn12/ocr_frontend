import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { useToast } from '../composables/useToast'

export const useAppStore = defineStore('app', () => {
  const toast = useToast()
  const user = ref(JSON.parse(localStorage.getItem('ocr_user') || 'null'))
  const documents = ref([])
  const uploadQueue = ref([])
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  const stats = computed(() => ({
    total: documents.value.length,
    pending_ocr: documents.value.filter(d => d.status === 'OCR_PROCESSING' || d.status === 'UPLOADED').length,
    pending_review: documents.value.filter(d => d.status === 'READY_FOR_REVIEW').length,
    approved: documents.value.filter(d => d.status === 'APPROVED').length,
    rejected: documents.value.filter(d => d.status === 'REJECTED').length,
  }))

  // Role mapping from API to frontend
  const roleMap = {
    UPLOADER: 'field_operator',
    REVIEWER: 'reviewer',
    ADMIN: 'admin',
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const response = await api.login(email, password)
      const { user: userData, tokens } = response.data

      const frontendUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: roleMap[userData.role] || 'field_operator',
        apiRole: userData.role,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      }

      user.value = frontendUser
      localStorage.setItem('ocr_user', JSON.stringify(frontendUser))
      toast.success('Login successful!')
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
    error.value = null
    try {
      const response = await api.register(name, email, password, role)
      const { user: userData, tokens } = response.data

      const frontendUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: roleMap[role] || 'field_operator',
        apiRole: role,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
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
    user.value = null
    documents.value = []
    localStorage.removeItem('ocr_user')
    toast.info('Logged out successfully')
  }

  async function fetchDocuments(page = 1, limit = 20, status = null) {
    loading.value = true
    error.value = null
    try {
      const response = await api.listDocuments(page, limit, status)
      documents.value = response.data
      return response
    } catch (err) {
      error.value = err.message
      toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function getDocument(id) {
    loading.value = true
    error.value = null
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

  async function uploadDocument(file) {
    const queueItem = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      status: 'queued',
      progress: 0,
      file,
    }
    uploadQueue.value.push(queueItem)
    return queueItem.id
  }

  async function processQueue() {
    for (const item of uploadQueue.value) {
      if (item.status === 'queued') {
        item.status = 'uploading'
        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            if (item.progress < 90) {
              item.progress += Math.random() * 30
            }
          }, 300)

          const response = await api.uploadDocument(item.file)
          clearInterval(progressInterval)
          item.progress = 100
          item.status = 'done'
          item.result = response.data

          toast.success(`${item.name} uploaded successfully!`)

          // Refresh documents list
          await fetchDocuments()
        } catch (err) {
          item.status = 'error'
          item.error = err.message
          toast.error(`Upload failed: ${err.message}`)
        }
      }
    }
  }

  function removeFromQueue(id) {
    uploadQueue.value = uploadQueue.value.filter(i => i.id !== id)
  }

  async function approveDocument(documentId, notes = '') {
    loading.value = true
    error.value = null
    try {
      const response = await api.approveDocument(documentId, notes)
      // Refresh documents
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
    error.value = null
    try {
      const response = await api.rejectDocument(documentId, notes)
      // Refresh documents
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
    error.value = null
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

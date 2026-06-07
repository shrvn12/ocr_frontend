const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

function getHealthURL(baseURL) {
  return `${baseURL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')}/health`
}

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.healthURL = getHealthURL(API_BASE_URL)
  }

  async checkHealth() {
    const response = await fetch(this.healthURL, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`)
    }

    return response
  }

  getAuthToken() {
    const user = JSON.parse(localStorage.getItem('ocr_user') || 'null')
    return user?.accessToken || null
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error)
      throw error
    }
  }

  // Auth endpoints
  async register(name, email, password, role = 'UPLOADER') {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    })
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async refreshToken(refreshToken) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me', {
      method: 'GET',
    })
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  async listUsers(page = 1, limit = 20) {
    return this.request(`/auth/users?page=${page}&limit=${limit}`, {
      method: 'GET',
    })
  }

  async toggleUserActive(userId) {
    return this.request(`/auth/users/${userId}/toggle-active`, {
      method: 'PATCH',
    })
  }

  // Document endpoints
  async uploadDocument(file) {
    const formData = new FormData()
    formData.append('document', file)

    const token = this.getAuthToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseURL}/documents/upload`, {
      method: 'POST',
      body: formData,
      headers,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`)
    }
    return data
  }

  async listDocuments(page = 1, limit = 20, status = null, uploadedById = null) {
    let url = `/documents?page=${page}&limit=${limit}`
    if (status) url += `&status=${status}`
    if (uploadedById) url += `&uploadedById=${uploadedById}`
    return this.request(url, { method: 'GET' })
  }

  async getDocument(id) {
    return this.request(`/documents/${id}`, { method: 'GET' })
  }

  async updateDocumentStatus(id, status) {
    return this.request(`/documents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async deleteDocument(id) {
    return this.request(`/documents/${id}`, { method: 'DELETE' })
  }

  // OCR endpoints
  async processOCR(documentId) {
    return this.request(`/ocr/${documentId}/process`, { method: 'POST' })
  }

  async retryOCR(documentId) {
    return this.request(`/ocr/${documentId}/retry`, { method: 'POST' })
  }

  async getOCRResult(documentId) {
    return this.request(`/ocr/${documentId}/result`, { method: 'GET' })
  }

  // Review endpoints
  async listReviews(page = 1, limit = 20, minConfidence = null, maxConfidence = null, hasCorrections = null) {
    let url = `/reviews?page=${page}&limit=${limit}`
    if (minConfidence !== null) url += `&minConfidence=${minConfidence}`
    if (maxConfidence !== null) url += `&maxConfidence=${maxConfidence}`
    if (hasCorrections !== null) url += `&hasCorrections=${hasCorrections}`
    return this.request(url, { method: 'GET' })
  }

  async getReview(id) {
    return this.request(`/reviews/${id}`, { method: 'GET' })
  }

  async correctField(documentId, fieldName, correctedValue, reason = '') {
    return this.request(`/reviews/${documentId}/fields`, {
      method: 'PATCH',
      body: JSON.stringify({ fieldName, correctedValue, reason }),
    })
  }

  async correctFieldsBulk(documentId, corrections = []) {
    return this.request(`/reviews/${documentId}/fields/bulk`, {
      method: 'PATCH',
      body: JSON.stringify({ corrections }),
    })
  }

  async approveDocument(documentId, notes = '') {
    return this.request(`/reviews/${documentId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectDocument(documentId, notes = '') {
    return this.request(`/reviews/${documentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  }

  async markFieldAsManual(documentId, fieldId) {
    return this.request(`/reviews/${documentId}/fields/${fieldId}/mark-manual`, {
      method: 'POST',
    })
  }

  async addMissingField(documentId, fieldName, value) {
    return this.request(`/reviews/${documentId}/fields`, {
      method: 'POST',
      body: JSON.stringify({ fieldName, value }),
    })
  }

  // Audit log endpoints
  async getAuditLogs(documentId, page = 1, limit = 20) {
    return this.request(`/audit-logs?documentId=${documentId}&page=${page}&limit=${limit}`, {
      method: 'GET',
    })
  }

  // Stats endpoints
  async getStats() {
    return this.request('/stats', { method: 'GET' })
  }
}

export default new APIClient()

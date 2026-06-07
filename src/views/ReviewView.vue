<template>
  <div class="page" v-if="doc && !loading">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <RouterLink to="/dashboard" class="back-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </RouterLink>
        <div>
          <h1 class="page-title">
            Review — <span class="mono">{{ doc.id }}</span>
          </h1>
          <p class="page-subtitle">{{ doc.originalName }} · Captured {{ formatDate(doc.createdAt) }} by {{ doc.uploadedBy?.name }}</p>
        </div>
      </div>
      <div class="header-status">
        <StatusBadge :status="doc.status" />
        <ConfidenceBadge :score="getAvgConfidence()" />
      </div>
    </div>

    <!-- Main layout: image + fields -->
    <div class="review-grid">
      <!-- Left: Image -->
      <div class="card image-panel">
        <div class="section-title" style="margin-bottom:12px;">Original Image</div>
        <div class="image-placeholder">
          <img v-if="doc.cloudinaryUrl" :src="doc.cloudinaryUrl" alt="Document" class="preview-img" style="max-height: 300px; object-fit: contain;" />
          <div v-else>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color:var(--text-3)"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p class="text-muted text-sm" style="margin-top:10px;">Document image</p>
          </div>
        </div>
        <div class="image-meta" style="margin-top: 14px;">
          <div class="meta-row"><span class="meta-key">File Name</span><span class="meta-val mono">{{ doc.originalName }}</span></div>
          <div class="meta-row"><span class="meta-key">Status</span><span class="meta-val">{{ doc.status }}</span></div>
          <div class="meta-row"><span class="meta-key">Operator</span><span class="meta-val">{{ doc.uploadedBy?.name }}</span></div>
        </div>
      </div>

      <!-- Right: Extracted Fields -->
      <div class="card fields-panel">
        <!-- Show for reviewers/admins: Editable fields -->
        <div v-if="canEdit">
          <div class="section-header">
            <span class="section-title">Extracted Fields</span>
            <span v-if="edited" class="edit-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Unsaved changes
            </span>
          </div>

          <div class="fields-list">
            <div v-for="field in doc.extractedFields" :key="field.id" class="field-row">
              <div class="field-meta">
                <span class="field-label">{{ formatKey(field.fieldName) }}</span>
                <ConfidenceBadge :score="Math.round(field.confidence * 100)" />
              </div>
              <input
                :class="['mono', confidenceInputCls(field.confidence)]"
                :value="localFields[field.fieldName]"
                @input="onFieldInput(field.fieldName, $event.target.value)"
              />
            </div>

            <div v-if="!doc.extractedFields?.length" class="empty-fields">
              <p class="text-muted text-sm">No fields extracted yet — OCR pending</p>
            </div>
          </div>

          <!-- Note -->
          <div class="form-group" style="margin-top: 16px;">
            <label class="form-label">Review Note</label>
            <textarea v-model="note" rows="2" placeholder="Optional note for audit log…" style="resize:vertical;"></textarea>
          </div>

          <!-- Actions -->
          <div class="action-bar" v-if="canAct">
            <button class="btn btn-danger" @click="reject" :disabled="approveLoading || rejectLoading">
              <svg v-if="!rejectLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <svg v-else class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>
              {{ rejectLoading ? 'Rejecting…' : 'Reject' }}
            </button>
            <button class="btn btn-success" @click="approve" :disabled="approveLoading || rejectLoading">
              <svg v-if="!approveLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <svg v-else class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>
              {{ approveLoading ? 'Approving…' : 'Approve' }}
            </button>
          </div>

          <div v-else class="final-status">
            <span v-if="doc.status === 'APPROVED'" class="final-approved">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Approved
            </span>
            <span v-else-if="doc.status === 'REJECTED'" class="final-rejected">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Rejected
            </span>
          </div>
        </div>

        <!-- Show for uploaders: Read-only fields -->
        <div v-else>
          <div class="section-header">
            <span class="section-title">Extracted Fields</span>
          </div>

          <div class="fields-list">
            <div v-for="field in doc.extractedFields" :key="field.id" class="field-row">
              <div class="field-meta">
                <span class="field-label">{{ formatKey(field.fieldName) }}</span>
                <ConfidenceBadge :score="Math.round(field.confidence * 100)" />
              </div>
              <div class="readonly-field">{{ localFields[field.fieldName] }}</div>
            </div>

            <div v-if="!doc.extractedFields?.length" class="empty-fields">
              <p class="text-muted text-sm">No fields extracted yet — OCR pending</p>
            </div>
          </div>

          <div style="padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--border); color: var(--text-3); font-size: 13px;">
            <p>You can only view audit history. Contact a reviewer to make corrections.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Audit Log -->
    <div class="card" style="margin-top: 16px;">
      <div class="section-title" style="margin-bottom: 14px;">Audit History</div>
      <AuditLogTable :log="doc.auditLogs || []" />
    </div>
  </div>

  <!-- Loading state -->
  <div class="page" v-else-if="loading">
    <div class="card" style="text-align:center; padding:48px;">
      <p class="text-muted">Loading document…</p>
    </div>
  </div>

  <!-- Error state -->
  <div class="page" v-else-if="error">
    <div class="card" style="text-align:center; padding:48px;">
      <p class="text-muted">{{ error }}</p>
      <RouterLink to="/dashboard" class="btn btn-ghost" style="margin-top:16px;">Back to Dashboard</RouterLink>
    </div>
  </div>

  <!-- Not found -->
  <div class="page" v-else>
    <div class="card" style="text-align:center; padding:48px;">
      <p class="text-muted">Document <span class="mono">{{ route.params.id }}</span> not found.</p>
      <RouterLink to="/dashboard" class="btn btn-ghost" style="margin-top:16px;">Back to Dashboard</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useToast } from '../composables/useToast'
import StatusBadge from '../components/StatusBadge.vue'
import ConfidenceBadge from '../components/ConfidenceBadge.vue'
import AuditLogTable from '../components/AuditLogTable.vue'
import api from '../services/api'

const store  = useAppStore()
const route  = useRoute()
const router = useRouter()
const toast  = useToast()

const doc = ref(null)
const loading = ref(false)
const error = ref('')
const approveLoading = ref(false)
const rejectLoading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.getDocument(route.params.id)
    doc.value = response.data
  } catch (err) {
    error.value = err.message || 'Failed to load document'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
})

const localFields = ref({})
const edited = ref(false)
const note   = ref('')

watch(doc, (d) => {
  if (d && d.extractedFields) {
    localFields.value = {}
    d.extractedFields.forEach(field => {
      localFields.value[field.fieldName] = field.finalValue || field.correctedValue || field.rawValue || ''
    })
  }
}, { immediate: true })

const canAct = computed(() => doc.value && doc.value.status === 'READY_FOR_REVIEW')
const canEdit = computed(() => store.user?.role !== 'field_operator')

// Only update local field state, don't send API calls
function onFieldInput(fieldName, value) {
  localFields.value[fieldName] = value
  edited.value = true
}

// Get corrections to send on approve
function getFieldCorrections() {
  if (!doc.value?.extractedFields) return []
  
  const corrections = []
  doc.value.extractedFields.forEach(field => {
    const currentValue = localFields.value[field.fieldName]
    const originalValue = field.finalValue || field.correctedValue || field.rawValue || ''
    
    // Only include fields that were changed
    if (currentValue !== originalValue && currentValue !== '') {
      corrections.push({
        fieldName: field.fieldName,
        correctedValue: currentValue
      })
    }
  })
  return corrections
}

async function approve() {
  try {
    approveLoading.value = true
    
    // Get any field corrections
    const corrections = getFieldCorrections()
    
    // Send all corrections first if any exist
    if (corrections.length > 0) {
      try {
        await api.correctFieldsBulk(doc.value.id, corrections)
        toast.success(`${corrections.length} field(s) corrected`)
      } catch (err) {
        toast.error(`Failed to correct fields: ${err.message}`)
        return
      }
    }
    
    // Then approve the document
    await api.approveDocument(doc.value.id, note.value)
    toast.success('Document approved successfully')
    edited.value = false
    note.value = ''
    router.push('/dashboard')
  } catch (err) {
    toast.error(err.message || 'Failed to approve document')
  } finally {
    approveLoading.value = false
  }
}

async function reject() {
  try {
    rejectLoading.value = true
    await api.rejectDocument(doc.value.id, note.value)
    toast.success('Document rejected')
    edited.value = false
    note.value = ''
    router.push('/dashboard')
  } catch (err) {
    toast.error(err.message || 'Failed to reject document')
  } finally {
    rejectLoading.value = false
  }
}

function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/_/g, ' ')
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function confidenceInputCls(score) {
  if (score === null || score === undefined) return ''
  if (score >= 0.9) return 'field-high'
  if (score >= 0.7) return 'field-mid'
  return 'field-low'
}

function getAvgConfidence() {
  if (!doc.value?.extractedFields?.length) return 0
  const avg = doc.value.extractedFields.reduce((sum, f) => sum + (f.confidence || 0), 0) / doc.value.extractedFields.length
  return Math.round(avg * 100)
}
</script>

<style scoped>
.header-left { display: flex; align-items: flex-start; gap: 14px; }

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-3);
  text-decoration: none;
  font-size: 13px;
  padding: 5px 0;
  margin-top: 4px;
  white-space: nowrap;
  transition: color 0.12s;
}
.back-btn:hover { color: var(--text-1); }

.header-status { display: flex; align-items: center; gap: 12px; }

.review-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 860px) {
  .review-grid { grid-template-columns: 1fr; }
}

.image-panel { }

.image-placeholder {
  background: var(--bg);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  overflow: hidden;
}

.image-placeholder img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}

.meta-row { display: flex; justify-content: space-between; font-size: 13px; }
.meta-key { color: var(--text-3); }
.meta-val { font-weight: 500; }

.fields-panel { }

.fields-list { display: flex; flex-direction: column; gap: 12px; }

.field-row { display: flex; flex-direction: column; gap: 5px; }

.field-meta { display: flex; align-items: center; justify-content: space-between; }

.field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-2); }

/* Confidence-tinted input borders */
.field-high { border-color: rgba(5, 150, 105, 0.4); }
.field-mid  { border-color: rgba(217, 119, 6, 0.4); }
.field-low  { border-color: rgba(220, 38, 38, 0.4); background: rgba(254,242,242,0.4); }

.readonly-field {
  padding: 8px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: var(--text-1);
}

.edit-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--warning);
  font-weight: 500;
}

.empty-fields {
  padding: 24px;
  text-align: center;
  background: var(--bg);
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border);
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  margin-top: 4px;
  border-top: 1px solid var(--border);
}

.final-status {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 4px;
  border-top: 1px solid var(--border);
}

.final-approved, .final-rejected {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
}
.final-approved { background: var(--success-bg); color: var(--success); }
.final-rejected { background: var(--error-bg);   color: var(--error); }

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

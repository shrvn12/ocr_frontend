<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Search Documents</h1>
        <p class="page-subtitle">{{ filtered.length }} result(s)</p>
      </div>
      <button class="btn btn-ghost btn-sm" @click="clearFilters">Clear Filters</button>
    </div>

    <div class="search-layout">
      <!-- Filters sidebar -->
      <div class="filters-panel card">
        <div class="section-title" style="margin-bottom:16px;">Filters</div>

        <div class="filter-group">
          <label class="form-label">Status</label>
          <select v-model="filters.status">
            <option value="">All</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="OCR_PROCESSING">OCR Processing</option>
            <option value="OCR_FAILED">OCR Failed</option>
            <option value="READY_FOR_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="form-label">Min Confidence</label>
          <div class="range-wrap">
            <input type="range" v-model.number="filters.minConfidence" min="0" max="100" step="5" />
            <span class="range-val mono">{{ filters.minConfidence > 0 ? filters.minConfidence + '%' : 'Any' }}</span>
          </div>
        </div>

        <div class="filter-group">
          <label class="form-label">Date From</label>
          <input type="date" v-model="filters.dateFrom" />
        </div>

        <div class="filter-group">
          <label class="form-label">Date To</label>
          <input type="date" v-model="filters.dateTo" />
        </div>
      </div>

      <!-- Results -->
      <div class="results-panel card">
        <div class="section-header">
          <span class="section-title">Results ({{ sorted.length }})</span>
          <div class="sort-wrap">
            <select v-model="sortBy" style="font-size:12px; padding:4px 8px; width:auto;">
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
            </select>
          </div>
        </div>

        <DocumentTable :docs="sorted" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import DocumentTable from '../components/DocumentTable.vue'
import api from '../services/api'

const store = useAppStore()

const documents = ref([])
const loading = ref(false)

const filters = ref({
  status: '',
  minConfidence: 0,
  dateFrom: '',
  dateTo: '',
})

const sortBy = ref('createdAt_desc')

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.listDocuments(1, 100)
    documents.value = response.data
  } catch (err) {
    console.error('Failed to fetch documents:', err)
  } finally {
    loading.value = false
  }
})

function clearFilters() {
  filters.value = { status: '', minConfidence: 0, dateFrom: '', dateTo: '' }
}

const filtered = computed(() => {
  return documents.value.filter(doc => {
    const f = filters.value
    if (f.status && doc.status !== f.status) return false
    if (f.minConfidence > 0) {
      const avgConf = doc.extractedFields?.length 
        ? (doc.extractedFields.reduce((sum, field) => sum + field.confidence, 0) / doc.extractedFields.length) * 100
        : 0
      if (avgConf < f.minConfidence) return false
    }
    if (f.dateFrom && new Date(doc.createdAt) < new Date(f.dateFrom)) return false
    if (f.dateTo) {
      const to = new Date(f.dateTo)
      to.setDate(to.getDate() + 1)
      if (new Date(doc.createdAt) >= to) return false
    }
    return true
  })
})

const sorted = computed(() => {
  const [field, dir] = sortBy.value.split('_')
  return [...filtered.value].sort((a, b) => {
    let aVal = a[field], bVal = b[field]
    if (field === 'createdAt') { aVal = new Date(aVal); bVal = new Date(bVal) }
    if (aVal === null) return 1
    if (bVal === null) return -1
    return dir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
  })
})
</script>

<style scoped>
.search-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  min-width: 0;
}

@media (max-width: 760px) {
  .search-layout {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }

  .sort-wrap,
  .sort-wrap select {
    width: 100%;
  }
}

.filters-panel,
.results-panel {
  min-width: 0;
}

.filters-panel { display: flex; flex-direction: column; gap: 14px; }

.results-panel {
  overflow: hidden;
}

.filter-group { display: flex; flex-direction: column; gap: 5px; }

.range-wrap { display: flex; align-items: center; gap: 10px; min-width: 0; }
.range-wrap input[type=range] { flex: 1; min-width: 0; accent-color: var(--accent); }
.range-val { font-size: 11px; color: var(--text-2); min-width: 30px; text-align: right; }

.sort-wrap { display: flex; align-items: center; }
</style>

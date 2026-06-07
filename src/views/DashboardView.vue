<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">{{ today }}</p>
      </div>
      <RouterLink v-if="store.user?.role !== 'reviewer'" to="/capture" class="btn btn-accent">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Capture
      </RouterLink>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Documents</div>
        <div class="stat-value mono">{{ store.stats.total }}</div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-label">Pending OCR</div>
        <div class="stat-value mono">{{ store.stats.pending_ocr }}</div>
      </div>
      <div class="stat-card stat-info">
        <div class="stat-label">Pending Review</div>
        <div class="stat-value mono">{{ store.stats.pending_review }}</div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-label">Approved</div>
        <div class="stat-value mono">{{ store.stats.approved }}</div>
      </div>
      <div class="stat-card stat-danger">
        <div class="stat-label">Rejected</div>
        <div class="stat-value mono">{{ store.stats.rejected }}</div>
      </div>
    </div>

    <!-- Pending Review -->
    <div class="card" style="margin-top: 28px;">
      <div class="section-header">
        <span class="section-title">Pending Review</span>
        <RouterLink to="/search" class="btn btn-ghost btn-sm">View All</RouterLink>
      </div>
      <DocumentTable :docs="pendingDocs" />
    </div>

    <!-- Recent Activity -->
    <div class="card" style="margin-top: 16px;">
      <div class="section-header">
        <span class="section-title">Recent</span>
      </div>
      <DocumentTable :docs="recentDocs" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import DocumentTable from '../components/DocumentTable.vue'

const store = useAppStore()

onMounted(async () => {
  await store.fetchDocuments()
})

const today = computed(() => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
const pendingDocs = computed(() => store.documents.filter(d => d.status === 'READY_FOR_REVIEW'))
const recentDocs  = computed(() => [...store.documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5))
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow);
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-1);
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
}

.stat-warning { border-top: 3px solid var(--warning); }
.stat-info    { border-top: 3px solid var(--info); }
.stat-success { border-top: 3px solid var(--success); }
.stat-danger  { border-top: 3px solid var(--error); }
</style>

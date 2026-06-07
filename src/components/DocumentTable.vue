<template>
  <div class="doc-table-frame" :class="{ 'with-scroll-cue': showScrollCue }">
    <div v-if="showScrollCue" class="scroll-cue">
      <span>More columns</span>
      <span aria-hidden="true">-></span>
    </div>
    <div class="doc-table-wrap">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>File Name</th>
          <th>Status</th>
          <th>Confidence</th>
          <th>Created</th>
          <th>By</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!docs.length">
          <td colspan="7" style="text-align:center; padding: 32px; color: var(--text-3);">No documents found</td>
        </tr>
        <tr v-for="doc in docs" :key="doc.id">
          <td><span class="mono text-sm">{{ doc.id.slice(0, 8) }}...</span></td>
          <td>{{ doc.originalName }}</td>
          <td><StatusBadge :status="doc.status" /></td>
          <td><ConfidenceBadge :score="getAvgConfidence(doc)" /></td>
          <td class="text-muted text-sm">{{ formatDate(doc.createdAt) }}</td>
          <td class="text-muted text-sm">{{ doc.uploadedBy?.name || '—' }}</td>
          <td>
            <RouterLink :to="`/review/${doc.id}`" class="btn btn-ghost btn-sm">Review</RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'
import ConfidenceBadge from './ConfidenceBadge.vue'

defineProps({
  docs: { type: Array, default: () => [] },
  showScrollCue: { type: Boolean, default: false },
})

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function getAvgConfidence(doc) {
  if (!doc?.extractedFields?.length) return 0
  const avg = doc.extractedFields.reduce((sum, f) => sum + (f.confidence || 0), 0) / doc.extractedFields.length
  return Math.round(avg * 100)
}
</script>

<style scoped>
.doc-table-frame {
  position: relative;
  min-width: 0;
}

.doc-table-wrap {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-color: var(--accent) var(--border-subtle);
  scrollbar-width: thin;
}

.doc-table-wrap::-webkit-scrollbar {
  height: 8px;
}

.doc-table-wrap::-webkit-scrollbar-track {
  background: var(--border-subtle);
  border-radius: 999px;
}

.doc-table-wrap::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 999px;
}

table {
  min-width: 760px;
}

.scroll-cue {
  display: none;
}

@media (max-width: 760px) {
  .with-scroll-cue::after {
    content: '';
    position: absolute;
    top: 34px;
    right: 0;
    bottom: 8px;
    width: 34px;
    pointer-events: none;
    background: linear-gradient(to right, transparent, var(--surface));
  }

  .scroll-cue {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg);
    color: var(--text-2);
    font-size: 11px;
    font-weight: 600;
  }
}
</style>

<template>
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
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'
import ConfidenceBadge from './ConfidenceBadge.vue'

defineProps({ docs: { type: Array, default: () => [] } })

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
.doc-table-wrap { overflow-x: auto; }
</style>

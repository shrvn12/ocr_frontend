<template>
  <div
    class="doc-table-frame"
    :class="{
      'has-scroll-overflow': showScrollCue && isHorizontallyScrollable,
      'is-scrolled-end': isScrolledEnd,
    }"
  >
    <div v-if="showScrollHint" class="scroll-cue">← Scroll horizontally to view more fields →</div>

    <div ref="tableWrap" class="doc-table-wrap" @scroll="onTableScroll">
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
            <td class="text-muted text-sm">{{ doc.uploadedBy?.name || '-' }}</td>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import StatusBadge from './StatusBadge.vue'
import ConfidenceBadge from './ConfidenceBadge.vue'

const props = defineProps({
  docs: { type: Array, default: () => [] },
  showScrollCue: { type: Boolean, default: false },
})

const tableWrap = ref(null)
const isHorizontallyScrollable = ref(false)
const isScrolledEnd = ref(false)
const hasUserScrolled = ref(false)
const hiddenRatio = ref(0)

const showScrollHint = computed(() =>
  props.showScrollCue &&
  isHorizontallyScrollable.value &&
  hiddenRatio.value > 0.15 &&
  !hasUserScrolled.value
)

function updateScrollState() {
  const el = tableWrap.value
  if (!el) return

  const hiddenWidth = Math.max(0, el.scrollWidth - el.clientWidth)
  isHorizontallyScrollable.value = hiddenWidth > 1
  hiddenRatio.value = el.scrollWidth ? hiddenWidth / el.scrollWidth : 0
  isScrolledEnd.value = !isHorizontallyScrollable.value || el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
}

function onTableScroll() {
  if (tableWrap.value?.scrollLeft > 0) {
    hasUserScrolled.value = true
  }
  updateScrollState()
}

onMounted(() => {
  nextTick(updateScrollState)
  window.addEventListener('resize', updateScrollState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollState)
})

watch(() => props.docs.length, () => {
  hasUserScrolled.value = false
  nextTick(updateScrollState)
})

function formatDate(ts) {
  if (!ts) return '-'
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

.doc-table-frame.has-scroll-overflow:not(.is-scrolled-end)::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 8px;
  width: 36px;
  pointer-events: none;
  background: linear-gradient(to right, transparent, var(--surface));
  box-shadow: inset -14px 0 14px -18px rgba(17, 24, 39, 0.7);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  color: var(--text-2);
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 760px) {
  .scroll-cue {
    display: flex;
  }
}
</style>

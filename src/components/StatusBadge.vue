<template>
  <span class="badge" :class="variant">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: { type: String, required: true } })

const MAP = {
  UPLOADED:          { label: 'Uploaded',       cls: 'badge-warning' },
  OCR_PROCESSING:    { label: 'Processing',     cls: 'badge-warning' },
  OCR_FAILED:        { label: 'OCR Failed',     cls: 'badge-danger' },
  READY_FOR_REVIEW:  { label: 'Pending Review', cls: 'badge-info' },
  APPROVED:          { label: 'Approved',       cls: 'badge-success' },
  REJECTED:          { label: 'Rejected',       cls: 'badge-danger' },
  // Legacy values for backward compatibility
  pending_ocr:     { label: 'Pending OCR',    cls: 'badge-warning' },
  pending_review:  { label: 'Pending Review', cls: 'badge-info' },
  approved:        { label: 'Approved',       cls: 'badge-success' },
  rejected:        { label: 'Rejected',       cls: 'badge-danger' },
}

const label   = computed(() => MAP[props.status]?.label   ?? props.status)
const variant = computed(() => MAP[props.status]?.cls     ?? 'badge-default')
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.badge-warning { background: var(--warning-bg); color: var(--warning); }
.badge-info    { background: var(--info-bg);    color: var(--info); }
.badge-success { background: var(--success-bg); color: var(--success); }
.badge-danger  { background: var(--error-bg);   color: var(--error); }
.badge-default { background: var(--border);     color: var(--text-2); }
</style>

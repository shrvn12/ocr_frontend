<template>
  <div class="audit-table-wrapper">
    <div v-if="!log?.length" style="text-align: center; color: var(--text-3); padding: 24px;">
      <p class="text-sm">No audit entries yet</p>
    </div>

    <div v-for="entry in log" :key="entry.id" class="audit-entry">
      <!-- Header: action + user + time -->
      <div class="entry-header">
        <div class="entry-meta">
          <span class="action-tag" :class="actionClass(entry.action)">{{ formatAction(entry.action) }}</span>
          <span class="entry-user">{{ entry.user?.name }}</span>
          <span class="role-chip">{{ entry.user?.role }}</span>
          <span class="entry-time">{{ formatTs(entry.createdAt) }}</span>
        </div>
      </div>

      <!-- Field name + old → new value (works for both FIELD_CORRECTED and status changes) -->
      <div v-if="entry.oldValue || entry.newValue" class="value-diff">
        <div v-if="entry.fieldName" class="diff-field-label">{{ formatKey(entry.fieldName) }}</div>
        <div class="diff-row">
          <span v-if="entry.oldValue" class="diff-old mono">{{ entry.oldValue }}</span>
          <span v-if="entry.oldValue && entry.newValue" class="diff-arrow">→</span>
          <span v-if="entry.newValue" class="diff-new mono">{{ entry.newValue }}</span>
        </div>
        <!-- Bulk indicator + reason for FIELD_CORRECTED -->
        <div v-if="entry.metadata?.bulkOperation || entry.metadata?.reason" class="diff-meta">
          <span v-if="entry.metadata?.bulkOperation" class="bulk-chip">Bulk</span>
          <span v-if="entry.metadata?.reason" class="text-muted text-sm">{{ entry.metadata.reason }}</span>
        </div>
      </div>

      <!-- Approved fields snapshot (DOCUMENT_APPROVED) -->
      <div v-if="entry.metadata?.approvedFields?.length" class="approved-fields">
        <div class="approved-label">Approved field values</div>
        <div class="approved-list">
          <span v-for="f in entry.metadata.approvedFields" :key="f.id" class="approved-chip mono">
            {{ f.finalValue }}
          </span>
        </div>
      </div>

      <!-- Notes (approval/rejection) -->
      <div v-if="entry.metadata?.notes" class="entry-notes">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {{ entry.metadata.notes }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ log: { type: Array, default: () => [] } })

const ACTION_MAP = {
  DOCUMENT_UPLOADED: 'Uploaded',
  OCR_COMPLETED:     'OCR Processed',
  OCR_FAILED:        'OCR Failed',
  FIELD_CORRECTED:   'Field Corrected',
  DOCUMENT_APPROVED: 'Approved',
  DOCUMENT_REJECTED: 'Rejected',
  STATUS_CHANGED:    'Status Changed',
}

function formatAction(action) {
  return ACTION_MAP[action] ?? action
}

function formatTs(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function actionClass(action) {
  if (action === 'DOCUMENT_APPROVED') return 'act-success'
  if (action === 'DOCUMENT_REJECTED') return 'act-danger'
  if (action === 'OCR_FAILED')        return 'act-danger'
  if (action === 'OCR_COMPLETED')     return 'act-info'
  if (action === 'FIELD_CORRECTED')   return 'act-warning'
  return 'act-default'
}
</script>

<style scoped>
.audit-table-wrapper { display: flex; flex-direction: column; gap: 10px; }

.audit-entry {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Header */
.entry-header { margin: 0; }
.entry-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.action-tag {
  font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 100px;
}
.act-success { background: var(--success-bg); color: var(--success); }
.act-danger  { background: var(--error-bg);   color: var(--error); }
.act-info    { background: var(--info-bg);     color: var(--info); }
.act-warning { background: rgba(217,119,6,0.12); color: var(--warning); }
.act-default { background: var(--border);      color: var(--text-2); }

.entry-user { font-size: 12px; font-weight: 600; color: var(--text-1); }

.role-chip {
  font-size: 10px; font-weight: 600;
  padding: 2px 6px; border-radius: 100px;
  background: var(--border); color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.04em;
}

.entry-time {
  font-size: 11px; color: var(--text-3);
  font-family: 'JetBrains Mono', monospace;
  margin-left: auto;
}

/* Field value diff */
.value-diff {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diff-field-label {
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--text-3);
}

.diff-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.diff-old {
  font-size: 13px;
  color: var(--error);
  text-decoration: line-through;
  background: var(--error-bg);
  padding: 2px 8px;
  border-radius: 3px;
}

.diff-arrow {
  color: var(--text-3);
  font-size: 14px;
  flex-shrink: 0;
}

.diff-new {
  font-size: 13px;
  color: var(--success);
  background: var(--success-bg);
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}

.diff-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-chip {
  font-size: 10px; font-weight: 600;
  padding: 1px 6px; border-radius: 100px;
  background: var(--info-bg); color: var(--info);
  text-transform: uppercase; letter-spacing: 0.03em;
}

/* Approved fields */
.approved-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.approved-label {
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--text-3);
}

.approved-list { display: flex; flex-wrap: wrap; gap: 6px; }

.approved-chip {
  font-size: 12px;
  padding: 3px 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-1);
}

/* Notes */
.entry-notes {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 12px;
  color: var(--text-2);
  padding: 8px 10px;
  background: var(--surface);
  border-left: 3px solid var(--info);
  border-radius: 0 4px 4px 0;
}
.entry-notes svg { flex-shrink: 0; margin-top: 1px; color: var(--info); }
</style>
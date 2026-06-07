<template>
  <div class="queue" v-if="store.uploadQueue.length">
    <div class="queue-header">
      <span class="section-title">Upload Queue</span>
      <span class="text-muted text-sm">{{ store.uploadQueue.length }} file(s)</span>
    </div>
    <div class="queue-list">
      <div v-for="item in store.uploadQueue" :key="item.id" class="queue-item">
        <div class="queue-item-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <span class="queue-item-name text-sm">{{ item.name }}</span>
          <span class="queue-item-size text-muted text-sm">{{ formatSize(item.size) }}</span>
        </div>
        <div class="queue-item-right">
          <span class="queue-status" :class="statusCls(item.status)">{{ item.status }}</span>
          <div class="progress-bar" v-if="item.status === 'uploading' || item.status === 'done'">
            <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
          </div>
          <button v-if="item.status === 'queued'" class="remove-btn" @click="store.removeFromQueue(item.id)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'
const store = useAppStore()

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function statusCls(s) {
  if (s === 'done') return 'qs-done'
  if (s === 'uploading') return 'qs-uploading'
  return 'qs-queued'
}
</script>

<style scoped>
.queue { margin-top: 24px; }

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.queue-list { display: flex; flex-direction: column; gap: 6px; }

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.queue-item-info { display: flex; align-items: center; gap: 8px; min-width: 0; }
.queue-item-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
.queue-item-size { flex-shrink: 0; }
.queue-item-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.queue-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 100px;
  text-transform: capitalize;
}
.qs-queued    { background: var(--border);      color: var(--text-3); }
.qs-uploading { background: var(--info-bg);     color: var(--info); }
.qs-done      { background: var(--success-bg);  color: var(--success); }

.progress-bar {
  width: 80px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--info);
  border-radius: 2px;
  transition: width 0.2s;
}

.remove-btn {
  background: transparent;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}
.remove-btn:hover { color: var(--error); }
</style>

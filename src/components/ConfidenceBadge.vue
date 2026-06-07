<template>
  <span v-if="score !== null && score !== undefined" class="conf-badge" :class="cls">
    <span class="conf-bar-wrap"><span class="conf-bar" :style="{ width: score + '%' }"></span></span>
    <span class="conf-value mono">{{ score }}%</span>
  </span>
  <span v-else class="conf-badge conf-na text-muted mono">—</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ score: { type: Number, default: null } })

const cls = computed(() => {
  if (props.score === null || props.score === undefined) return ''
  if (props.score >= 90) return 'conf-high'
  if (props.score >= 70) return 'conf-mid'
  return 'conf-low'
})
</script>

<style scoped>
.conf-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.conf-bar-wrap {
  width: 44px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.conf-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.conf-high .conf-bar   { background: var(--success); }
.conf-mid  .conf-bar   { background: var(--warning); }
.conf-low  .conf-bar   { background: var(--error); }

.conf-high .conf-value { color: var(--success); }
.conf-mid  .conf-value { color: var(--warning); }
.conf-low  .conf-value { color: var(--error); }

.conf-value { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.conf-na    { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
</style>

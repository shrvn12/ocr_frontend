<template>
  <div class="toast-container" v-if="toast.toasts.length > 0">
    <transition-group name="toast-fade" tag="div">
      <div v-for="item in toast.toasts" :key="item.id" class="toast" :class="`toast-${item.type}`">
        <div class="toast-icon">
          <svg v-if="item.type === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <svg v-else-if="item.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else-if="item.type === 'warning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div class="toast-message">{{ item.message }}</div>
        <button class="toast-close" @click="toast.remove(item.id)">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast'

const toast = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
}

.toast-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-1);
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.2s;
}

.toast-close:hover {
  color: var(--text-1);
}

/* Toast variants */
.toast-error {
  border-color: rgba(220, 38, 38, 0.3);
  background: rgba(254, 242, 242, 0.5);
}
.toast-error .toast-icon {
  color: var(--error);
}

.toast-success {
  border-color: rgba(5, 150, 105, 0.3);
  background: rgba(240, 253, 250, 0.5);
}
.toast-success .toast-icon {
  color: var(--success);
}

.toast-warning {
  border-color: rgba(217, 119, 6, 0.3);
  background: rgba(254, 252, 232, 0.5);
}
.toast-warning .toast-icon {
  color: var(--warning);
}

.toast-info {
  border-color: rgba(37, 99, 235, 0.3);
  background: rgba(239, 246, 255, 0.5);
}
.toast-info .toast-icon {
  color: var(--info);
}

/* Animations */
@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.toast-fade-leave-to {
  transform: translateX(400px);
  opacity: 0;
}

@media (max-width: 520px) {
  .toast-container {
    top: 12px;
    left: 12px;
    right: 12px;
    max-width: none;
  }

  .toast {
    min-width: 0;
    width: 100%;
  }
}
</style>

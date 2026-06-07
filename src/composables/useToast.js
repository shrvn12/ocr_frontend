import { ref } from 'vue'

// Toast queue
const toasts = ref([])
let toastId = 0

const TOAST_DURATION = 3000 // 3 seconds

export function useToast() {
  function add(message, type = 'info') {
    const id = ++toastId
    const toast = { id, message, type }
    toasts.value.push(toast)
    
    // Auto-remove after duration
    setTimeout(() => {
      remove(id)
    }, TOAST_DURATION)
    
    return id
  }

  function remove(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function error(message) {
    return add(message, 'error')
  }

  function success(message) {
    return add(message, 'success')
  }

  function warning(message) {
    return add(message, 'warning')
  }

  function info(message) {
    return add(message, 'info')
  }

  return {
    toasts,
    add,
    remove,
    error,
    success,
    warning,
    info,
  }
}

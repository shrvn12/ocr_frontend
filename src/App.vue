<template>
  <div class="layout" v-if="store.isAuthenticated">
    <AppSidebar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
  <RouterView v-else />
  <ToastContainer />
</template>

<script setup>
import { h, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAppStore } from './stores/app'
import AppSidebar from './components/AppSidebar.vue'
import ToastContainer from './components/ToastContainer.vue'
import api from './services/api'
import { startNetworkToasts } from './services/networkToasts'

const store = useAppStore()
const toast = useToast()

onMounted(() => {
  checkBackendHealth()
  startNetworkToasts()
})

async function checkBackendHealth() {
  let waitingToastId = null
  let backendReady = false
  const slowTimer = setTimeout(() => {
    waitingToastId = toast.info(
      h('div', { class: 'render-toast' }, [
        h('div', 'waiting for render to spin up'),
        h('div', { class: 'render-toast-subtext' }, 'this may take upto 50 seconds'),
      ]),
      {
        timeout: false,
        closeOnClick: false,
      }
    )
  }, 3000)

  try {
    await api.checkHealth()
    backendReady = true
  } catch (error) {
    console.error('Backend health check failed:', error)
  } finally {
    clearTimeout(slowTimer)
    if (waitingToastId !== null) {
      toast.dismiss(waitingToastId)
      if (backendReady) {
        toast.success('render booted up')
      }
    }
  }
}
</script>

<style scoped>
/* ── Desktop: sidebar left, content right ── */
.layout {
  display: flex;
  flex-direction: row;
  min-height: 100svh;
}

.main-content {
  flex: 1;
  min-width: 0;        /* prevent flex blowout on wide content */
  overflow-y: auto;
}

/* ── Mobile: sidebar on top, content below ── */
@media (max-width: 760px) {
  .layout {
    flex-direction: column;
    min-height: 100svh;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
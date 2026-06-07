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
import { onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAppStore } from './stores/app'
import AppSidebar from './components/AppSidebar.vue'
import ToastContainer from './components/ToastContainer.vue'
import api from './services/api'

const store = useAppStore()
const toast = useToast()

onMounted(() => {
  checkBackendHealth()
})

async function checkBackendHealth() {
  let waitingToastId = null
  const slowTimer = setTimeout(() => {
    waitingToastId = toast.info('waiting for render to spin up', {
      timeout: false,
      closeOnClick: false,
    })
  }, 3000)

  try {
    await api.checkHealth()
  } catch (error) {
    console.error('Backend health check failed:', error)
  } finally {
    clearTimeout(slowTimer)
    if (waitingToastId !== null) {
      toast.dismiss(waitingToastId)
    }
  }
}
</script>

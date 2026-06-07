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
import { useAppStore } from './stores/app'
import AppSidebar from './components/AppSidebar.vue'
import ToastContainer from './components/ToastContainer.vue'
const store = useAppStore()
</script>

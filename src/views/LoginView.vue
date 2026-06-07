<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="login-brand-icon">⬡</span>
        <h1 class="login-title">DocScan OCR</h1>
        <p class="login-subtitle">Document capture and review system</p>
      </div>

      <form class="login-form" @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" autocomplete="email" required />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" required />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn btn-primary btn-lg login-btn" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <div class="demo-logins">
        <p class="demo-title">Demo logins</p>
        <div class="demo-row">
          <span>Admin</span>
          <code>admin@ocr.dev / Admin@1234</code>
        </div>
        <div class="demo-row">
          <span>Reviewer</span>
          <code>reviewer@ocr.dev / Review@1234</code>
        </div>
        <div class="demo-row">
          <span>Uploader</span>
          <code>uploader@ocr.dev / Upload@1234</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const store  = useAppStore()
const router = useRouter()

const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

const HOME = { field_operator: '/capture', reviewer: '/dashboard', admin: '/dashboard' }

async function submit() {
  if (!email.value || !password.value) { 
    error.value = 'Please fill all fields'
    return 
  }
  
  loading.value = true
  error.value = ''
  
  const success = await store.login(email.value, password.value)
  
  if (success) {
    const frontendRole = store.user?.role
    router.push(HOME[frontendRole] ?? '/dashboard')
  } else {
    error.value = store.error || 'Login failed. Please check your credentials.'
  }
  
  loading.value = false
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.login-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 40px 36px;
  width: 100%;
  max-width: 380px;
  box-shadow: var(--shadow-md);
}

.login-header { text-align: center; margin-bottom: 32px; }

.login-brand-icon {
  font-size: 28px;
  color: var(--accent);
  display: block;
  margin-bottom: 10px;
}

.login-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 6px; }
.login-subtitle { color: var(--text-3); font-size: 13px; }

.login-form { display: flex; flex-direction: column; gap: 18px; }

.login-btn { width: 100%; justify-content: center; margin-top: 4px; }

.error-msg {
  font-size: 12px;
  color: var(--error);
  background: var(--error-bg);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
}

.demo-logins {
  margin-top: 20px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
}

.demo-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.demo-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  font-size: 12px;
  color: var(--text-3);
}

.demo-row + .demo-row {
  border-top: 1px solid var(--border-subtle);
}

.demo-row span {
  flex: 0 0 58px;
  font-weight: 600;
  color: var(--text-2);
}

.demo-row code {
  display: block;
  overflow-wrap: anywhere;
  padding: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-1);
  background: transparent;
}

@media (max-width: 520px) {
  .login-page {
    align-items: stretch;
    padding: 18px 14px;
  }

  .login-card {
    padding: 28px 20px;
    margin: auto 0;
  }
}
</style>

<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <span class="brand-icon">⬡</span>
      <span class="brand-name">DocScan</span>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="nav-active"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.icon"></svg>
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="logout-section">
        <p @click="logout" title="Logout" class="logout-link">Logout</p>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-details">
          <div class="user-name">{{ store.user?.name }}</div>
          <div class="user-role">{{ roleLabel }}</div>
        </div>
      </div>
      <!-- <button class="logout-btn" @click="logout" title="Logout">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button> -->
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()

const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  capture:   '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  search:    '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
}

const ALL_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: ['reviewer', 'admin'] },
  { to: '/capture',   label: 'Capture',   icon: ICONS.capture,   roles: ['field_operator', 'admin'] },
  { to: '/search',    label: 'Search',    icon: ICONS.search,    roles: ['field_operator', 'reviewer', 'admin'] },
]

const navItems = computed(() =>
  ALL_NAV.filter(item => item.roles.includes(store.user?.role))
)

const ROLE_LABELS = {
  field_operator: 'Field Operator',
  reviewer:       'Reviewer',
  admin:          'Admin / Auditor',
}

const roleLabel = computed(() => ROLE_LABELS[store.user?.role] ?? store.user?.role)

const initials = computed(() => {
  const name = store.user?.name || ''
  return name.slice(0, 2).toUpperCase()
})

function logout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  min-width: 200px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.brand-icon {
  font-size: 18px;
  color: var(--accent);
  line-height: 1;
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 5px;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: background 0.12s, color 0.12s;
}

.nav-item:hover { background: var(--sidebar-hover); color: #fff; }

.nav-active {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active) !important;
}

.sidebar-footer {
  padding: 14px 14px 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.user-info { display: flex; align-items: center; gap: 9px; min-width: 0; }

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details { min-width: 0; }

.user-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.35);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: color 0.12s, background 0.12s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.logout-link {
  font-size: 12.5px;
  color: #fff;
  cursor: pointer;
  transition: color 0.12s;
  text-align: center;
}

.logout-section {
  display: flex;
  justify-content: center;
  width: 100%;
}
.logout-link:hover { color: #fff; background: rgba(255,255,255,0.08); }

@media (max-width: 760px) {
  .sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    position: sticky;
    z-index: 20;
    box-shadow: var(--shadow-md);
  }

  .sidebar-brand {
    padding: 12px 14px;
  }

  .sidebar-nav {
    flex: none;
    flex-direction: row;
    gap: 6px;
    overflow-x: auto;
    padding: 8px 10px 10px;
    scrollbar-width: none;
  }

  .sidebar-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-item {
    flex: 0 0 auto;
    padding: 8px 10px;
  }

  .sidebar-footer {
    display: none;
  }
}
</style>

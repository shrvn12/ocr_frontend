<template>
  <aside class="sidebar">

    <!-- Row 1 (mobile: brand left, avatar+logout right) -->
    <div class="sidebar-top">
      <div class="sidebar-brand">
        <span class="brand-icon">⬡</span>
        <span class="brand-name">DocScan</span>
      </div>

      <!-- shown only on mobile, in the top-right corner -->
      <div class="mobile-user">
        <div class="user-avatar">{{ initials }}</div>
        <button class="logout-btn" @click="logout" title="Logout">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Row 2: nav links -->
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

    <!-- Desktop-only footer: avatar + name + logout -->
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-details">
          <div class="user-name">{{ store.user?.name }}</div>
          <div class="user-role">{{ roleLabel }}</div>
        </div>
      </div>
      <button class="logout-btn" @click="logout" title="Logout">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
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

const roleLabel  = computed(() => ROLE_LABELS[store.user?.role] ?? store.user?.role)
const initials   = computed(() => (store.user?.name || '').slice(0, 2).toUpperCase())

function logout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ────────────────────────────────────────────
   Desktop — vertical sidebar column
──────────────────────────────────────────── */
.sidebar {
  width: 200px;
  min-width: 200px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  flex-shrink: 0;
}

/* sidebar-top: only brand visible on desktop */
.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px 18px;
}

.brand-icon  { font-size: 18px; color: var(--accent); line-height: 1; }
.brand-name  { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: 0.02em; }

/* mobile-user hidden on desktop */
.mobile-user { display: none; }

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

.nav-item:hover  { background: var(--sidebar-hover); color: #fff; }
.nav-active      { background: var(--sidebar-active-bg) !important; color: var(--sidebar-active) !important; }

.sidebar-footer {
  padding: 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.user-info   { display: flex; align-items: center; gap: 9px; min-width: 0; }
.user-details { min-width: 0; }

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
  display: flex;
  align-items: center;
  transition: color 0.12s, background 0.12s;
  flex-shrink: 0;
}

.logout-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }


/* ────────────────────────────────────────────
   Mobile — two-row top navbar
   Row 1: brand (left)  +  avatar & logout (right)
   Row 2: nav links (scrollable row)
──────────────────────────────────────────── */
@media (max-width: 760px) {
  .sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    min-height: unset;
    position: sticky;
    top: 0;
    z-index: 20;
    box-shadow: var(--shadow-md);
  }

  /* Row 1 */
  .sidebar-top {
    padding: 0 12px 0 0;   /* right padding so logout isn't flush to edge */
  }

  .sidebar-brand {
    padding: 10px 14px;
  }

  /* show avatar + logout in top-right on mobile */
  .mobile-user {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-user .user-avatar {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }

  .mobile-user .logout-btn {
    color: rgba(255,255,255,0.55);
    padding: 7px;
    scale: 1.1;
  }

  /* Row 2 */
  .sidebar-nav {
    flex: none;
    flex-direction: row;
    gap: 4px;
    padding: 0 10px 8px;
    overflow-x: auto;
    scrollbar-width: none;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 6px;
  }

  .sidebar-nav::-webkit-scrollbar { display: none; }

  .nav-item {
    flex: 0 0 auto;
    padding: 7px 10px;
    font-size: 13px;
  }

  /* hide desktop footer on mobile — user controls live in sidebar-top */
  .sidebar-footer { display: none; }
}
</style>
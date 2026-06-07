import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '../stores/app'

// routes with required roles
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/dashboard', component: () => import('../views/DashboardView.vue'), meta: { roles: ['reviewer', 'admin'] } },
  { path: '/capture',   component: () => import('../views/CaptureView.vue'),   meta: { roles: ['field_operator', 'admin'] } },
  { path: '/review/:id',component: () => import('../views/ReviewView.vue'),    meta: { roles: ['field_operator', 'reviewer', 'admin'] } },
  { path: '/search',    component: () => import('../views/SearchView.vue'),    meta: { roles: ['field_operator', 'reviewer', 'admin'] } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

// Default landing per role
const HOME = {
  field_operator: '/capture',
  reviewer:       '/dashboard',
  admin:          '/dashboard',
}

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const store = useAppStore()

  // Allow public routes
  if (to.meta.public) return true

  // Redirect to login if not authenticated
  if (!store.isAuthenticated) return '/login'

  // Redirect to home if already logged in and going to login
  if (to.path === '/login' && store.isAuthenticated) {
    return HOME[store.user?.role] ?? '/dashboard'
  }

  // Role-based access control
  if (to.meta.roles && store.user) {
    if (!to.meta.roles.includes(store.user.role)) {
      // User doesn't have permission, redirect to home
      return HOME[store.user.role] ?? '/dashboard'
    }
  }

  return true
})

export default router

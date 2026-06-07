import { computed } from 'vue'
import { useAppStore } from '../stores/app'

export function usePermissions() {
  const store = useAppStore()

  const user = computed(() => store.user)
  const role = computed(() => store.user?.role)

  // Check if user has specific role
  const isAdmin = computed(() => role.value === 'admin')
  const isReviewer = computed(() => role.value === 'reviewer')
  const isFieldOperator = computed(() => role.value === 'field_operator')

  // Check if user can perform actions
  const canCapture = computed(() => isAdmin.value || isFieldOperator.value)
  const canReview = computed(() => isAdmin.value || isReviewer.value)
  const canSearch = computed(() => true) // All authenticated users can search
  const canViewDashboard = computed(() => isAdmin.value || isReviewer.value)

  // Check if user has specific permission
  const hasRole = (roles) => {
    if (!Array.isArray(roles)) roles = [roles]
    return roles.includes(role.value)
  }

  return {
    user,
    role,
    isAdmin,
    isReviewer,
    isFieldOperator,
    canCapture,
    canReview,
    canSearch,
    canViewDashboard,
    hasRole,
  }
}

import { useAuthStore } from '../stores'

/**
 * Custom hook for authentication
 * Wraps the auth store for cleaner component usage
 */
export function useAuth() {
    const {
        user,
        isLoading,
        isAuthenticated,
        error,
        isConfigured,
        login,
        register,
        logout,
        clearError
    } = useAuthStore()

    return {
        user,
        isLoading,
        isAuthenticated,
        error,
        isConfigured,
        login,
        register,
        logout,
        clearError
    }
}

import { useEffect } from 'react'
import { useBudgetStore } from '../stores'
import { useAuth } from './useAuth'

/**
 * Custom hook for user profile management
 */
export function useProfile() {
    const { user } = useAuth()
    const {
        profile,
        isLoading,
        error,
        fetchProfile,
        updateProfile
    } = useBudgetStore()

    useEffect(() => {
        if (user?.id && !profile) {
            fetchProfile(user.id)
        }
    }, [user?.id, profile, fetchProfile])

    const update = async (updates) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        return updateProfile(user.id, updates)
    }

    return {
        profile,
        isLoading,
        error,
        updateProfile: update,
        currencyPreference: profile?.currency_preference || 'USD',
        monthlyIncomeGoal: profile?.monthly_income_goal || 0
    }
}

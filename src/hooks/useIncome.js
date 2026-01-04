import { useEffect, useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useAuth } from './useAuth'
import { getCurrentMonth, isCurrentMonth } from '../utils'

/**
 * Custom hook for income management
 */
export function useIncome() {
    const { user } = useAuth()
    const {
        incomeSources,
        isLoading,
        error,
        fetchIncomeSources,
        addIncomeSource,
        deleteIncomeSource
    } = useBudgetStore()

    useEffect(() => {
        if (user?.id && incomeSources.length === 0) {
            fetchIncomeSources(user.id)
        }
    }, [user?.id, incomeSources.length, fetchIncomeSources])

    // Filter current month income
    const currentMonthIncome = useMemo(() => {
        return incomeSources.filter(income => isCurrentMonth(income.date))
    }, [incomeSources])

    // Calculate totals
    const totalMonthlyIncome = useMemo(() => {
        return currentMonthIncome.reduce((sum, income) => sum + Number(income.amount), 0)
    }, [currentMonthIncome])

    // Filter by frequency
    const recurringIncome = useMemo(() => {
        return incomeSources.filter(income => income.frequency === 'recurring')
    }, [incomeSources])

    const add = async (data) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        return addIncomeSource({ ...data, user_id: user.id })
    }

    const remove = async (id) => {
        return deleteIncomeSource(id)
    }

    const refresh = () => {
        if (user?.id) fetchIncomeSources(user.id)
    }

    return {
        incomeSources,
        currentMonthIncome,
        recurringIncome,
        totalMonthlyIncome,
        isLoading,
        error,
        addIncome: add,
        deleteIncome: remove,
        refresh
    }
}

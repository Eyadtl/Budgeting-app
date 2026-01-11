import { useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useIncome } from './useIncome'
import { useExpenses } from './useExpenses'
import {
    calculateWeeklyLimit,
    calculateProRatedWeeklyLimit,
    getWeeklySpendingStatus,
    getDaysRemainingInWeek,
    getStartOfWeek
} from '../utils'

/**
 * Custom hook for weekly spending limit calculations
 * Provides real-time weekly limit data based on remaining income
 */
export function useWeeklyLimit() {
    const { profile } = useBudgetStore()
    const { totalMonthlyIncome } = useIncome()
    const { currentMonthExpenses, totalMonthlyExpenses } = useExpenses()

    // Check if feature is enabled (default to true)
    const isEnabled = profile?.weekly_limit_enabled ?? true

    // Calculate current week's expenses
    const currentWeekExpenses = useMemo(() => {
        const weekStart = getStartOfWeek()
        return currentMonthExpenses.filter(expense => {
            const expenseDate = new Date(expense.date)
            const isDebtPayment = expense.name && expense.name.startsWith('Debt Payment:')
            // Check if expense is explicitly excluded from limit
            const isExcluded = expense.exclude_from_limit === true
            return expenseDate >= weekStart && !isDebtPayment && !isExcluded
        })
    }, [currentMonthExpenses])

    const spentThisWeek = useMemo(() => {
        return currentWeekExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentWeekExpenses])

    // Calculate limits
    const weeklyLimit = useMemo(() => {
        return calculateWeeklyLimit(totalMonthlyIncome, totalMonthlyExpenses)
    }, [totalMonthlyIncome, totalMonthlyExpenses])

    const proRatedLimit = useMemo(() => {
        return calculateProRatedWeeklyLimit(weeklyLimit)
    }, [weeklyLimit])

    // Get status
    const status = useMemo(() => {
        return getWeeklySpendingStatus(spentThisWeek, proRatedLimit)
    }, [spentThisWeek, proRatedLimit])

    // Calculate percentage for progress bar
    const percentageUsed = useMemo(() => {
        if (proRatedLimit <= 0) return 100
        return Math.min(100, Math.round((spentThisWeek / proRatedLimit) * 100))
    }, [spentThisWeek, proRatedLimit])

    const daysRemaining = getDaysRemainingInWeek()

    return {
        isEnabled,
        weeklyLimit,
        proRatedLimit,
        spentThisWeek,
        remainingThisWeek: Math.max(0, proRatedLimit - spentThisWeek),
        percentageUsed,
        status,
        daysRemaining,
        isExceeded: status === 'exceeded',
        isWarning: status === 'warning'
    }
}

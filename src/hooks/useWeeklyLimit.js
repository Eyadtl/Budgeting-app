import { useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useIncome } from './useIncome'
import { useExpenses } from './useExpenses'
import {
    calculateWeeklyLimit,
    calculateProRatedWeeklyLimit,
    getWeeklySpendingStatus,
    getDaysRemainingInWeek,
    getStartOfWeek,
    parseDate
} from '../utils'

const isIncludedInWeeklyLimit = (expense) => {
    const isDebtPayment = expense.name && expense.name.startsWith('Debt Payment:')
    const isExcluded = expense.exclude_from_limit === true
    return !isDebtPayment && !isExcluded
}

/**
 * Custom hook for weekly spending limit calculations
 * Provides real-time weekly limit data based on remaining income
 */
export function useWeeklyLimit() {
    const { profile } = useBudgetStore()
    const { totalMonthlyIncome } = useIncome()
    const { currentMonthExpenses } = useExpenses()

    // Check if feature is enabled (default to true)
    const isEnabled = profile?.weekly_limit_enabled ?? true

    // Calculate current week's expenses
    const currentWeekExpenses = useMemo(() => {
        const weekStart = getStartOfWeek()
        return currentMonthExpenses.filter(expense => {
            const expenseDate = parseDate(expense.date)
            return expenseDate >= weekStart && isIncludedInWeeklyLimit(expense)
        })
    }, [currentMonthExpenses])

    const spentThisWeek = useMemo(() => {
        return currentWeekExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentWeekExpenses])

    // Count only expenses that are part of weekly-limit tracking
    const monthlyIncludedExpenses = useMemo(() => {
        return currentMonthExpenses
            .filter(isIncludedInWeeklyLimit)
            .reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentMonthExpenses])

    // Calculate limits
    const weeklyLimit = useMemo(() => {
        return calculateWeeklyLimit(totalMonthlyIncome, monthlyIncludedExpenses)
    }, [totalMonthlyIncome, monthlyIncludedExpenses])

    const proRatedLimit = useMemo(() => {
        return calculateProRatedWeeklyLimit(weeklyLimit)
    }, [weeklyLimit])

    // Get status
    const status = useMemo(() => {
        return getWeeklySpendingStatus(spentThisWeek, weeklyLimit)
    }, [spentThisWeek, weeklyLimit])

    // Calculate percentage for progress bar
    const percentageUsed = useMemo(() => {
        if (weeklyLimit <= 0) return 100
        return Math.min(100, Math.round((spentThisWeek / weeklyLimit) * 100))
    }, [spentThisWeek, weeklyLimit])

    const daysRemaining = getDaysRemainingInWeek()

    return {
        isEnabled,
        weeklyLimit,
        proRatedLimit,
        spentThisWeek,
        remainingThisWeek: Math.max(0, weeklyLimit - spentThisWeek),
        percentageUsed,
        status,
        daysRemaining,
        isExceeded: status === 'exceeded',
        isWarning: status === 'warning'
    }
}

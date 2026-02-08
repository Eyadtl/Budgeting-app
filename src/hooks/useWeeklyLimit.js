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

const isCountedForRemainingMonthlyMoney = (expense) => {
    return Number(expense?.amount) > 0
}

/**
 * Custom hook for weekly spending limit calculations
 * Weekly limit is based on monthly money left after all expenses.
 * Weekly "spent" only tracks expenses not marked as excluded.
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

    // All expenses reduce remaining monthly money, including excluded ones.
    const monthlySpentFromIncome = useMemo(() => {
        return currentMonthExpenses
            .filter(isCountedForRemainingMonthlyMoney)
            .reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentMonthExpenses])

    // Calculate limits
    const weeklyLimit = useMemo(() => {
        return calculateWeeklyLimit(totalMonthlyIncome, monthlySpentFromIncome)
    }, [totalMonthlyIncome, monthlySpentFromIncome])

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

import { useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useIncome } from './useIncome'
import { useExpenses } from './useExpenses'
import { useBudgetSummary } from './useBudgetSummary'
import {
    calculateWeeklyLimit,
    calculateProRatedWeeklyLimit,
    getWeeklySpendingStatus,
    getDaysRemainingInWeek,
    getStartOfWeek,
    parseDate
} from '../utils'

const hasCategory = (categoryId) => (
    categoryId !== null
    && categoryId !== undefined
    && categoryId !== ''
)

export const isDebtPaymentExpense = (expense) => (
    Boolean(expense?.name && expense.name.startsWith('Debt Payment:'))
)

export const isExcludedExpense = (expense) => expense?.exclude_from_limit === true

export const isCategorizedExpense = (expense) => hasCategory(expense?.category_id)

export const isPaidExpense = (expense) => Number(expense?.amount) > 0

export const isWeeklyTrackedExpense = (expense) => {
    return !isDebtPaymentExpense(expense)
        && !isExcludedExpense(expense)
        && !isCategorizedExpense(expense)
}

export const shouldReduceWeeklyPool = (expense, weekStartMs, todayEndMs) => {
    if (!isPaidExpense(expense)) return false
    if (isDebtPaymentExpense(expense)) return false
    if (isCategorizedExpense(expense)) return false

    const expenseDateMs = parseDate(expense.date).getTime()
    if (!Number.isFinite(expenseDateMs)) return false
    if (expenseDateMs > todayEndMs) return false

    const isBeforeWeek = expenseDateMs < weekStartMs
    return isBeforeWeek || isExcludedExpense(expense)
}

/**
 * Custom hook for weekly spending limit calculations
 * Weekly limit updates each week from remaining monthly money.
 * Current-week spending tracks only uncategorized discretionary expenses.
 * Categorized assigned expenses and debt payments are excluded from weekly math.
 */
export function useWeeklyLimit() {
    const { profile } = useBudgetStore()
    const { effectiveMonthlyIncome } = useIncome()
    const { remaining: remainingAfterAssigned } = useBudgetSummary()
    const { currentMonthExpenses } = useExpenses()

    // Check if feature is enabled (default to true)
    const isEnabled = profile?.weekly_limit_enabled ?? true

    const weekStartMs = getStartOfWeek().getTime()
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const todayEndMs = today.getTime()

    // Calculate current week's expenses
    const currentWeekExpenses = useMemo(() => {
        return currentMonthExpenses.filter(expense => {
            const expenseDateMs = parseDate(expense.date).getTime()
            return expenseDateMs >= weekStartMs && isWeeklyTrackedExpense(expense)
        })
    }, [currentMonthExpenses, weekStartMs])

    const spentThisWeek = useMemo(() => {
        return currentWeekExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentWeekExpenses])

    // Reduce weekly pool by:
    // 1) uncategorized, non-debt expenses already paid before this week (carryover impact), and
    // 2) uncategorized, non-debt expenses marked excluded in this week.
    const paidImpactForWeeklyPool = useMemo(() => {
        return currentMonthExpenses
            .filter(expense => shouldReduceWeeklyPool(expense, weekStartMs, todayEndMs))
            .reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentMonthExpenses, weekStartMs, todayEndMs])

    // Calculate limits
    const weeklyLimit = useMemo(() => {
        const startingPool = Math.max(
            0,
            Number.isFinite(remainingAfterAssigned) ? remainingAfterAssigned : effectiveMonthlyIncome
        )
        return calculateWeeklyLimit(startingPool, paidImpactForWeeklyPool)
    }, [remainingAfterAssigned, effectiveMonthlyIncome, paidImpactForWeeklyPool])

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

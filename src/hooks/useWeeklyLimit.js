import { useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useIncome } from './useIncome'
import { useExpenses } from './useExpenses'
import { useBudgetSummary } from './useBudgetSummary'
import {
    calculateWeeklyLimit,
    calculateProRatedWeeklyLimit,
    getWeeklySpendingStatus,
    getCurrentBudgetPeriod,
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

export const shouldReduceWeeklyPool = (expense, periodStartMs, todayEndMs) => {
    if (!isPaidExpense(expense)) return false
    if (isDebtPaymentExpense(expense)) return false
    if (isCategorizedExpense(expense)) return false

    const expenseDateMs = parseDate(expense.date).getTime()
    if (!Number.isFinite(expenseDateMs)) return false
    if (expenseDateMs > todayEndMs) return false

    const isBeforeCurrentPeriod = expenseDateMs < periodStartMs
    return isBeforeCurrentPeriod || isExcludedExpense(expense)
}

/**
 * Custom hook for weekly spending limit calculations
 * Weekly limit updates on each month-bounded budget period.
 * Current-period spending tracks only uncategorized discretionary expenses.
 * Categorized assigned expenses and debt payments are excluded from weekly math.
 */
export function useWeeklyLimit() {
    const { profile } = useBudgetStore()
    const { effectiveMonthlyIncome } = useIncome()
    const { remaining: remainingAfterAssigned } = useBudgetSummary()
    const { currentMonthExpenses } = useExpenses()

    // Check if feature is enabled (default to true)
    const isEnabled = profile?.weekly_limit_enabled ?? true

    const currentPeriod = getCurrentBudgetPeriod()
    const periodStartMs = currentPeriod.start.getTime()
    const periodEndMs = currentPeriod.end.getTime()
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const todayEndMs = today.getTime()
    const currentPeriodEndMs = Math.min(periodEndMs, todayEndMs)

    // Calculate current period's expenses
    const currentPeriodExpenses = useMemo(() => {
        return currentMonthExpenses.filter(expense => {
            const expenseDateMs = parseDate(expense.date).getTime()
            return expenseDateMs >= periodStartMs
                && expenseDateMs <= currentPeriodEndMs
                && isWeeklyTrackedExpense(expense)
        })
    }, [currentMonthExpenses, periodStartMs, currentPeriodEndMs])

    const spentThisWeek = useMemo(() => {
        return currentPeriodExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentPeriodExpenses])

    // Reduce weekly pool by:
    // 1) uncategorized, non-debt expenses already paid before this period, and
    // 2) uncategorized, non-debt expenses marked excluded on or before today.
    const paidImpactForWeeklyPool = useMemo(() => {
        return currentMonthExpenses
            .filter(expense => shouldReduceWeeklyPool(expense, periodStartMs, todayEndMs))
            .reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentMonthExpenses, periodStartMs, todayEndMs])

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

    const daysRemaining = currentPeriod.daysRemaining

    return {
        isEnabled,
        weeklyLimit,
        proRatedLimit,
        spentThisWeek,
        remainingThisWeek: Math.max(0, weeklyLimit - spentThisWeek),
        percentageUsed,
        status,
        daysRemaining,
        periodDaysRemaining: currentPeriod.daysRemaining,
        periodTotalDays: currentPeriod.totalDays,
        periodStart: currentPeriod.start,
        periodEnd: currentPeriod.end,
        isExceeded: status === 'exceeded',
        isWarning: status === 'warning'
    }
}

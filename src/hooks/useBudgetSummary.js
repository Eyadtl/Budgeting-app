import { useMemo } from 'react'
import { useIncome } from './useIncome'
import { useCategories } from './useCategories'
import { useExpenses } from './useExpenses'

/**
 * Custom hook for budget summary calculations
 * Returns the zero-based budget status
 */
export function useBudgetSummary() {
    const { totalMonthlyIncome } = useIncome()
    const { totalBudgeted } = useCategories()
    const { currentMonthExpenses } = useExpenses()

    // Calculate actual debt payments made this month
    const monthlyDebtPayments = useMemo(() => {
        return currentMonthExpenses
            .filter(e => e.name && e.name.startsWith('Debt Payment:') && !e.category_id)
            .reduce((sum, e) => sum + Number(e.amount), 0)
    }, [currentMonthExpenses])

    // Total assigned = category budgets + debt payments
    const totalAssigned = useMemo(() => {
        // For zero-based budgeting, we count category budgets AND actual debt payments as "assigned"
        return totalBudgeted + monthlyDebtPayments
    }, [totalBudgeted, monthlyDebtPayments])

    // Calculate remaining to assign
    const remaining = useMemo(() => {
        return totalMonthlyIncome - totalAssigned
    }, [totalMonthlyIncome, totalAssigned])

    // Budget status
    const status = useMemo(() => {
        if (remaining < 0) return 'over'
        if (remaining === 0 && totalMonthlyIncome > 0) return 'balanced'
        if (remaining > 0) return 'under'
        return 'empty'
    }, [remaining, totalMonthlyIncome])

    // Percentage assigned
    const percentAssigned = useMemo(() => {
        if (totalMonthlyIncome === 0) return 0
        return Math.round((totalAssigned / totalMonthlyIncome) * 100)
    }, [totalAssigned, totalMonthlyIncome])

    return {
        totalIncome: totalMonthlyIncome,
        totalAssigned,
        remaining,
        status,
        percentAssigned,
        isBalanced: status === 'balanced',
        isOverBudget: status === 'over'
    }
}

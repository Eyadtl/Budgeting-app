import { useMemo } from 'react'
import { useIncome } from './useIncome'
import { useCategories } from './useCategories'
import { useDebts } from './useDebts'

/**
 * Custom hook for budget summary calculations
 * Returns the zero-based budget status
 */
export function useBudgetSummary() {
    const { totalMonthlyIncome } = useIncome()
    const { totalBudgeted } = useCategories()
    const { totalRemaining: totalDebtPayments } = useDebts()

    // Total assigned = category budgets (debt payments can optionally be included)
    const totalAssigned = useMemo(() => {
        // For zero-based budgeting, we only count category budgets as "assigned"
        // Debt payments are tracked separately but can be included if user chooses
        return totalBudgeted
    }, [totalBudgeted])

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

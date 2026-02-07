import { useEffect, useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useAuth } from './useAuth'

/**
 * Custom hook for debt management
 */
export function useDebts() {
    const { user } = useAuth()
    const {
        debts,
        isLoading,
        error,
        fetchDebts,
        addDebt,
        updateDebt,
        deleteDebt,
        addExpense
    } = useBudgetStore()

    useEffect(() => {
        if (user?.id && debts.length === 0) {
            fetchDebts(user.id)
        }
    }, [user?.id, debts.length, fetchDebts])

    // Calculate totals
    const totals = useMemo(() => {
        const totalBalance = debts.reduce((sum, debt) => sum + Number(debt.total_balance), 0)
        const totalPaid = debts.reduce((sum, debt) => sum + Number(debt.amount_paid), 0)
        const totalRemaining = totalBalance - totalPaid
        const paidOffCount = debts.filter(d => d.amount_paid >= d.total_balance).length

        return {
            totalBalance,
            totalPaid,
            totalRemaining,
            paidOffCount,
            activeCount: debts.length - paidOffCount
        }
    }, [debts])

    const add = async (data) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        return addDebt({ ...data, user_id: user.id })
    }

    const update = async (id, data) => {
        return updateDebt(id, data)
    }

    const recordPayment = async (debtId, amount, options = {}) => {
        const debt = debts.find(d => d.id === debtId)
        if (!debt) return { success: false, error: 'Debt not found' }
        if (!user?.id) return { success: false, error: 'Not authenticated' }

        const paymentAmount = Number(amount)
        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            return { success: false, error: 'Payment amount must be greater than 0' }
        }

        // Update the debt's amount_paid
        const newAmountPaid = Number(debt.amount_paid) + paymentAmount
        const debtResult = await updateDebt(debtId, { amount_paid: newAmountPaid })

        if (!debtResult.success) {
            return debtResult
        }

        // Also record this as an expense so it shows in expense tracking.
        const today = new Date().toISOString().split('T')[0]
        const expenseResult = await addExpense({
            user_id: user.id,
            name: `Debt Payment: ${debt.name}`,
            amount: paymentAmount,
            category_id: null,
            date: today,
            is_recurring: false,
            exclude_from_limit: options.exclude_from_limit === true
        })

        if (!expenseResult.success) {
            console.warn('Debt updated but expense creation failed:', expenseResult.error)
            // Still return success since the debt was updated
            return {
                success: true,
                warning: 'Debt was updated, but the payment entry could not be added to expenses.'
            }
        }

        return { success: true, warning: expenseResult.warning }
    }

    const remove = async (id) => {
        return deleteDebt(id)
    }

    const refresh = () => {
        if (user?.id) fetchDebts(user.id)
    }

    return {
        debts,
        ...totals,
        isLoading,
        error,
        addDebt: add,
        updateDebt: update,
        recordPayment,
        deleteDebt: remove,
        refresh
    }
}

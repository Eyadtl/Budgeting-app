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
        deleteDebt
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

    const recordPayment = async (debtId, amount) => {
        const debt = debts.find(d => d.id === debtId)
        if (!debt) return { success: false, error: 'Debt not found' }

        const newAmountPaid = Number(debt.amount_paid) + Number(amount)
        return updateDebt(debtId, { amount_paid: newAmountPaid })
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

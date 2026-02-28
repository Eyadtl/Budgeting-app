import { useEffect, useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useAuth } from './useAuth'
import { parseDate } from '../utils'
import {
    buildCurrentMonthSavingsRolloverPrompt,
    calculateSavingsBalance,
    calculateSetSavingsBalanceDelta
} from '../utils/savings'

function getTodayDateString() {
    return new Date().toISOString().split('T')[0]
}

function toAmount(value) {
    return Number(value)
}

/**
 * Custom hook for savings management and month-start savings rollover prompt
 */
export function useSavings() {
    const { user } = useAuth()
    const {
        savingsTransactions,
        monthlySavingsRollovers,
        savingsTransactionsLoaded,
        monthlySavingsRolloversLoaded,
        incomeSources,
        expenses,
        isLoading,
        error,
        fetchSavingsTransactions,
        addSavingsTransaction,
        deleteSavingsTransaction,
        fetchMonthlySavingsRollovers,
        upsertMonthlySavingsRollover
    } = useBudgetStore()

    useEffect(() => {
        if (user?.id && !savingsTransactionsLoaded) {
            fetchSavingsTransactions(user.id)
        }
    }, [user?.id, savingsTransactionsLoaded, fetchSavingsTransactions])

    useEffect(() => {
        if (user?.id && !monthlySavingsRolloversLoaded) {
            fetchMonthlySavingsRollovers(user.id)
        }
    }, [user?.id, monthlySavingsRolloversLoaded, fetchMonthlySavingsRollovers])

    const savingsTransactionsSorted = useMemo(() => {
        return [...savingsTransactions].sort((a, b) => {
            const byDate = parseDate(b.date) - parseDate(a.date)
            if (byDate !== 0) return byDate
            return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        })
    }, [savingsTransactions])

    const currentSavingsBalance = useMemo(() => {
        return calculateSavingsBalance(savingsTransactions)
    }, [savingsTransactions])

    const currentMonthRolloverPrompt = useMemo(() => {
        if (!monthlySavingsRolloversLoaded) return null
        return buildCurrentMonthSavingsRolloverPrompt({
            incomeSources,
            expenses,
            monthlySavingsRollovers
        })
    }, [incomeSources, expenses, monthlySavingsRollovers, monthlySavingsRolloversLoaded])

    const createTransaction = async ({
        type,
        signedAmount,
        note = '',
        date = getTodayDateString()
    }) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }

        const parsedSignedAmount = toAmount(signedAmount)
        if (!Number.isFinite(parsedSignedAmount) || parsedSignedAmount === 0) {
            return { success: false, error: 'Amount must be non-zero' }
        }

        return addSavingsTransaction({
            user_id: user.id,
            type,
            signed_amount: parsedSignedAmount,
            note: note || null,
            date
        })
    }

    const deposit = async (amount, options = {}) => {
        const parsed = toAmount(amount)
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return { success: false, error: 'Deposit amount must be greater than 0' }
        }

        return createTransaction({
            type: 'deposit',
            signedAmount: parsed,
            note: options.note,
            date: options.date
        })
    }

    const withdraw = async (amount, options = {}) => {
        const parsed = toAmount(amount)
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return { success: false, error: 'Withdraw amount must be greater than 0' }
        }

        if (parsed > currentSavingsBalance) {
            return { success: false, error: 'Cannot withdraw more than current savings balance' }
        }

        return createTransaction({
            type: 'withdraw',
            signedAmount: -parsed,
            note: options.note,
            date: options.date
        })
    }

    const setSavingsBalance = async (targetAmount, options = {}) => {
        const parsedTarget = toAmount(targetAmount)
        if (!Number.isFinite(parsedTarget) || parsedTarget < 0) {
            return { success: false, error: 'Savings balance cannot be negative' }
        }

        const delta = calculateSetSavingsBalanceDelta(currentSavingsBalance, parsedTarget)
        if (delta === 0) {
            return { success: false, error: 'Savings balance is already at that amount' }
        }

        return createTransaction({
            type: 'adjustment',
            signedAmount: delta,
            note: options.note || 'Set balance adjustment',
            date: options.date
        })
    }

    const acceptCurrentMonthRollover = async ({ amount, note = '' } = {}) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        if (!currentMonthRolloverPrompt) {
            return { success: false, error: 'No monthly savings rollover is available' }
        }

        const parsedAmount = toAmount(amount)
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return { success: false, error: 'Transfer amount must be greater than 0' }
        }

        const transactionResult = await createTransaction({
            type: 'rollover_transfer',
            signedAmount: parsedAmount,
            note: note || `Monthly rollover from ${currentMonthRolloverPrompt.sourceMonth}`,
            date: currentMonthRolloverPrompt.rolloverMonth
        })

        if (!transactionResult.success) return transactionResult

        const rolloverResult = await upsertMonthlySavingsRollover({
            user_id: user.id,
            rollover_month: currentMonthRolloverPrompt.rolloverMonth,
            source_month: currentMonthRolloverPrompt.sourceMonth,
            suggested_amount: currentMonthRolloverPrompt.suggestedAmount,
            accepted_amount: parsedAmount,
            status: 'accepted',
            processed_at: new Date().toISOString()
        })

        if (!rolloverResult.success) {
            return {
                success: false,
                error: rolloverResult.error,
                warning: 'Savings transfer was added, but rollover status could not be saved.'
            }
        }

        return {
            success: true,
            data: {
                transaction: transactionResult.data,
                rollover: rolloverResult.data
            }
        }
    }

    const skipCurrentMonthRollover = async () => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        if (!currentMonthRolloverPrompt) {
            return { success: false, error: 'No monthly savings rollover is available' }
        }

        return upsertMonthlySavingsRollover({
            user_id: user.id,
            rollover_month: currentMonthRolloverPrompt.rolloverMonth,
            source_month: currentMonthRolloverPrompt.sourceMonth,
            suggested_amount: currentMonthRolloverPrompt.suggestedAmount,
            accepted_amount: null,
            status: 'skipped',
            processed_at: new Date().toISOString()
        })
    }

    const removeTransaction = async (id) => {
        return deleteSavingsTransaction(id)
    }

    const refresh = () => {
        if (user?.id) {
            fetchSavingsTransactions(user.id)
            fetchMonthlySavingsRollovers(user.id)
        }
    }

    return {
        savingsTransactions: savingsTransactionsSorted,
        monthlySavingsRollovers,
        currentSavingsBalance,
        isLoading,
        error,
        savingsTransactionsLoaded,
        monthlySavingsRolloversLoaded,
        isRolloverPromptReady: monthlySavingsRolloversLoaded,
        currentMonthRolloverPrompt,
        deposit,
        withdraw,
        setSavingsBalance,
        deleteSavingsTransaction: removeTransaction,
        acceptCurrentMonthRollover,
        skipCurrentMonthRollover,
        refresh
    }
}


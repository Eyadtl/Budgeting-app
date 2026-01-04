import { useEffect, useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useAuth } from './useAuth'
import { isCurrentMonth } from '../utils'

/**
 * Custom hook for expense management
 */
export function useExpenses() {
    const { user } = useAuth()
    const {
        expenses,
        categories,
        isLoading,
        error,
        fetchExpenses,
        addExpense,
        deleteExpense
    } = useBudgetStore()

    useEffect(() => {
        if (user?.id && expenses.length === 0) {
            fetchExpenses(user.id)
        }
    }, [user?.id, expenses.length, fetchExpenses])

    // Filter current month expenses
    const currentMonthExpenses = useMemo(() => {
        return expenses.filter(expense => isCurrentMonth(expense.date))
    }, [expenses])

    // Calculate total monthly expenses
    const totalMonthlyExpenses = useMemo(() => {
        return currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    }, [currentMonthExpenses])

    // Group expenses by category
    const groupedByCategory = useMemo(() => {
        const groups = {}

        currentMonthExpenses.forEach(expense => {
            const categoryId = expense.category_id || 'uncategorized'
            if (!groups[categoryId]) {
                const category = categories.find(c => c.id === categoryId)
                groups[categoryId] = {
                    categoryId,
                    categoryName: category?.name || 'Uncategorized',
                    categoryColor: category?.color_code || '#94a3b8',
                    expenses: [],
                    total: 0
                }
            }
            groups[categoryId].expenses.push(expense)
            groups[categoryId].total += Number(expense.amount)
        })

        return Object.values(groups).sort((a, b) => b.total - a.total)
    }, [currentMonthExpenses, categories])

    // Get recurring expenses
    const recurringExpenses = useMemo(() => {
        return expenses.filter(exp => exp.is_recurring)
    }, [expenses])

    const add = async (data) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        return addExpense({ ...data, user_id: user.id })
    }

    const remove = async (id) => {
        return deleteExpense(id)
    }

    const refresh = () => {
        if (user?.id) fetchExpenses(user.id)
    }

    return {
        expenses,
        currentMonthExpenses,
        recurringExpenses,
        groupedByCategory,
        totalMonthlyExpenses,
        isLoading,
        error,
        addExpense: add,
        deleteExpense: remove,
        refresh
    }
}

import { useEffect, useMemo, useCallback } from 'react'
import { useBudgetStore } from '../stores'
import { useAuth } from './useAuth'
import { isCurrentMonth } from '../utils'

/**
 * Custom hook for category management
 */
export function useCategories() {
    const { user } = useAuth()
    const {
        categories,
        expenses,
        isLoading,
        error,
        fetchCategories,
        fetchExpenses,
        addCategory,
        updateCategory,
        deleteCategory
    } = useBudgetStore()

    useEffect(() => {
        if (user?.id && categories.length === 0) {
            fetchCategories(user.id)
        }
    }, [user?.id, categories.length, fetchCategories])

    // Calculate spent amount per category for current month
    const categoriesWithSpent = useMemo(() => {
        const currentMonthExpenses = expenses.filter(exp => isCurrentMonth(exp.date))

        return categories.map(category => {
            const spent = currentMonthExpenses
                .filter(exp => exp.category_id === category.id)
                .reduce((sum, exp) => sum + Number(exp.amount), 0)

            return {
                ...category,
                spent,
                remaining: category.budget_limit - spent,
                isOverBudget: spent > category.budget_limit
            }
        })
    }, [categories, expenses])

    // Calculate total budgeted
    const totalBudgeted = useMemo(() => {
        return categories.reduce((sum, cat) => sum + Number(cat.budget_limit), 0)
    }, [categories])

    const add = async (data) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        return addCategory({ ...data, user_id: user.id })
    }

    const update = async (id, data) => {
        return updateCategory(id, data)
    }

    const remove = async (id) => {
        return deleteCategory(id)
    }

    const refresh = () => {
        if (user?.id) fetchCategories(user.id)
    }

    return {
        categories,
        categoriesWithSpent,
        totalBudgeted,
        isLoading,
        error,
        addCategory: add,
        updateCategory: update,
        deleteCategory: remove,
        refresh
    }
}

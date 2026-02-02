import { useEffect, useMemo } from 'react'
import { useBudgetStore } from '../stores'
import { useAuth } from './useAuth'
import { getCurrentMonth, parseDate } from '../utils'

function toMonthKeyFromParts(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function toMonthKey(date) {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date.slice(0, 7)

    const d = parseDate(date)
    return toMonthKeyFromParts(d.getFullYear(), d.getMonth())
}

function toMonthStartDateString(year, monthIndex) {
    return `${toMonthKeyFromParts(year, monthIndex)}-01`
}

function toMonthIndex(year, monthIndex) {
    return year * 12 + monthIndex
}

function fromMonthIndex(idx) {
    const year = Math.floor(idx / 12)
    const month = idx % 12
    return { year, month }
}

/**
 * Custom hook for category management
 */
export function useCategories() {
    const { user } = useAuth()
    const {
        categories,
        categoryBudgets,
        expenses,
        isLoading,
        error,
        fetchCategories,
        fetchCategoryBudgets,
        addCategory,
        updateCategory,
        deleteCategory,
        upsertCategoryBudget
    } = useBudgetStore()

    useEffect(() => {
        if (user?.id && categories.length === 0) {
            fetchCategories(user.id)
        }
    }, [user?.id, categories.length, fetchCategories])

    useEffect(() => {
        if (user?.id && categoryBudgets.length === 0) {
            fetchCategoryBudgets(user.id)
        }
    }, [user?.id, categoryBudgets.length, fetchCategoryBudgets])

    const { month: currentMonth, year: currentYear } = getCurrentMonth()
    const currentMonthKey = useMemo(() => toMonthKeyFromParts(currentYear, currentMonth), [currentYear, currentMonth])
    const currentBudgetMonth = useMemo(() => toMonthStartDateString(currentYear, currentMonth), [currentYear, currentMonth])

    const budgetsByCategoryMonth = useMemo(() => {
        const map = new Map()
        for (const b of categoryBudgets) {
            if (!b?.category_id || !b?.budget_month) continue
            const monthKey = toMonthKey(b.budget_month)
            map.set(`${b.category_id}:${monthKey}`, Number(b.amount) || 0)
        }
        return map
    }, [categoryBudgets])

    const spentByCategoryMonth = useMemo(() => {
        const map = new Map()
        for (const exp of expenses) {
            if (!exp?.category_id) continue
            const monthKey = toMonthKey(exp.date)
            const key = `${exp.category_id}:${monthKey}`
            map.set(key, (map.get(key) || 0) + Number(exp.amount))
        }
        return map
    }, [expenses])

    // Calculate spent amount per category for current month (with rollover balance)
    const categoriesWithSpent = useMemo(() => {
        const currentIdx = toMonthIndex(currentYear, currentMonth)

        return categories.map(category => {
            const defaultBudget = Number(category.budget_limit) || 0
            const budgeted = budgetsByCategoryMonth.get(`${category.id}:${currentMonthKey}`) ?? defaultBudget
            const spent = spentByCategoryMonth.get(`${category.id}:${currentMonthKey}`) ?? 0

            // Carryover balance at the start of the current month
            let carryover = 0
            if (category?.created_at) {
                const created = parseDate(category.created_at)
                const startIdx = Math.min(currentIdx, toMonthIndex(created.getFullYear(), created.getMonth()))

                for (let idx = startIdx; idx < currentIdx; idx++) {
                    const { year, month } = fromMonthIndex(idx)
                    const mk = toMonthKeyFromParts(year, month)
                    const monthBudget = budgetsByCategoryMonth.get(`${category.id}:${mk}`) ?? defaultBudget
                    const monthSpent = spentByCategoryMonth.get(`${category.id}:${mk}`) ?? 0
                    carryover += monthBudget - monthSpent
                }
            }

            const available = carryover + budgeted
            const remaining = available - spent
            const isOverBudget = remaining < 0

            return {
                ...category,
                budgeted,
                carryover,
                available,
                spent,
                remaining,
                isOverBudget
            }
        })
    }, [categories, budgetsByCategoryMonth, spentByCategoryMonth, currentMonthKey, currentMonth, currentYear])

    // Calculate total budgeted (this month)
    const totalBudgeted = useMemo(() => {
        return categoriesWithSpent.reduce((sum, cat) => sum + Number(cat.budgeted || 0), 0)
    }, [categoriesWithSpent])

    const add = async (data) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        const result = await addCategory({ ...data, user_id: user.id })
        if (result.success) {
            const createdCategory = result.data
            if (createdCategory?.id) {
                await upsertCategoryBudget({
                    user_id: user.id,
                    category_id: createdCategory.id,
                    budget_month: currentBudgetMonth,
                    amount: Number(createdCategory.budget_limit) || 0
                })
            }
        }
        return result
    }

    const update = async (id, data) => {
        const result = await updateCategory(id, data)
        if (result.success) {
            if (Object.prototype.hasOwnProperty.call(data || {}, 'budget_limit')) {
                await upsertCategoryBudget({
                    user_id: user.id,
                    category_id: id,
                    budget_month: currentBudgetMonth,
                    amount: Number(data.budget_limit) || 0
                })
            }
        }
        return result
    }

    const updateBudget = async (categoryId, amount) => {
        if (!user?.id) return { success: false, error: 'Not authenticated' }
        return upsertCategoryBudget({
            user_id: user.id,
            category_id: categoryId,
            budget_month: currentBudgetMonth,
            amount: Number(amount) || 0
        })
    }

    const remove = async (id) => {
        return deleteCategory(id)
    }

    const refresh = () => {
        if (user?.id) {
            fetchCategories(user.id)
            fetchCategoryBudgets(user.id)
        }
    }

    return {
        categories,
        categoriesWithSpent,
        totalBudgeted,
        isLoading,
        error,
        addCategory: add,
        updateCategory: update,
        updateCategoryBudget: updateBudget,
        deleteCategory: remove,
        refresh
    }
}

import { create } from 'zustand'
import { supabase } from '../services/supabase/supabase'
import { buildCurrentMonthWeeklyCarryover } from '../utils/weeklyCarryover'

const isMissingTableError = (error, tableName) => (
    error?.message?.includes(tableName)
    && (
        error.message?.includes('does not exist')
        || error.message?.includes('schema cache')
    )
)

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} user_id
 * @property {string} currency_preference
 * @property {number} monthly_income_goal
 */

/**
 * @typedef {Object} IncomeSource
 * @property {string} id
 * @property {string} user_id
 * @property {string} name
 * @property {number} amount
 * @property {string} date
 * @property {'recurring'|'one-time'} frequency
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} user_id
 * @property {string} name
 * @property {number} budget_limit
 * @property {string} color_code
 */

/**
 * @typedef {Object} CategoryBudget
 * @property {string} id
 * @property {string} user_id
 * @property {string} category_id
 * @property {string} budget_month
 * @property {number} amount
 */

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} user_id
 * @property {string} name
 * @property {number} amount
 * @property {string} category_id
 * @property {string} date
 * @property {boolean} is_recurring
 */

/**
 * @typedef {Object} Debt
 * @property {string} id
 * @property {string} user_id
 * @property {string} name
 * @property {number} total_balance
 * @property {number} amount_paid
 * @property {number} interest_rate
 */

/**
 * @typedef {Object} SavingsTransaction
 * @property {string} id
 * @property {string} user_id
 * @property {'deposit'|'withdraw'|'adjustment'|'rollover_transfer'} type
 * @property {number} signed_amount
 * @property {string|null} note
 * @property {string} date
 */

/**
 * @typedef {Object} MonthlySavingsRollover
 * @property {string} id
 * @property {string} user_id
 * @property {string} rollover_month
 * @property {string} source_month
 * @property {number} suggested_amount
 * @property {number|null} accepted_amount
 * @property {'pending'|'accepted'|'skipped'} status
 */

/**
 * @typedef {Object} WeeklyLimitCarryover
 * @property {string} id
 * @property {string} user_id
 * @property {string} rollover_month
 * @property {string} source_month
 * @property {number} carryover_amount
 * @property {number} remaining_amount
 * @property {'pending'|'applied'|'settled'} status
 * @property {string|null} processed_at
 */

export const useBudgetStore = create((set, get) => ({
    // State
    profile: null,
    incomeSources: [],
    categories: [],
    categoryBudgets: [],
    expenses: [],
    debts: [],
    savingsTransactions: [],
    monthlySavingsRollovers: [],
    weeklyLimitCarryovers: [],
    savingsTransactionsLoaded: false,
    monthlySavingsRolloversLoaded: false,
    weeklyLimitCarryoversLoaded: false,
    isLoading: false,
    error: null,

    // Profile actions
    fetchProfile: async (userId) => {
        set({ isLoading: true, error: null })
        try {
            // First try to get existing profile
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            // If no profile exists (PGRST116) or data is null, create one
            if (!data || (error && error.code === 'PGRST116')) {
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: userId,
                        currency_preference: 'USD',
                        monthly_income_goal: 0
                    })
                    .select()
                    .single()

                if (createError) {
                    // If insert fails due to duplicate, try to fetch again
                    if (createError.code === '23505') {
                        const { data: existingProfile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('user_id', userId)
                            .single()
                        data = existingProfile
                    } else {
                        throw createError
                    }
                } else {
                    data = newProfile
                }
            } else if (error) {
                throw error
            }

            set({ profile: data, isLoading: false })
        } catch (error) {
            console.error('Profile fetch error:', error)
            // Don't block the app, just set profile as null
            set({ profile: null, isLoading: false })
        }
    },


    updateProfile: async (userId, updates) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .upsert({ user_id: userId, ...updates })
                .select()
                .single()

            if (error) throw error
            set({ profile: data })
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    // Income actions
    fetchIncomeSources: async (userId) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('income_sources')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })

            if (error) throw error
            set({ incomeSources: data || [], isLoading: false })
        } catch (error) {
            set({ error: error.message, isLoading: false })
        }
    },

    addIncomeSource: async (incomeSource) => {
        try {
            const { data, error } = await supabase
                .from('income_sources')
                .insert(incomeSource)
                .select()
                .single()

            if (error) throw error
            set((state) => ({
                incomeSources: [data, ...state.incomeSources],
            }))
            return { success: true, data }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    deleteIncomeSource: async (id) => {
        try {
            const { error } = await supabase
                .from('income_sources')
                .delete()
                .eq('id', id)

            if (error) throw error
            set((state) => ({
                incomeSources: state.incomeSources.filter((i) => i.id !== id),
            }))
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    // Category actions
    fetchCategories: async (userId) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId)

            if (error) throw error
            set({ categories: data || [], isLoading: false })
        } catch (error) {
            set({ error: error.message, isLoading: false })
        }
    },

    addCategory: async (category) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert(category)
                .select()
                .single()

            if (error) throw error
            set((state) => ({
                categories: [...state.categories, data],
            }))
            return { success: true, data }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    updateCategory: async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            set((state) => ({
                categories: state.categories.map((c) =>
                    c.id === id ? data : c
                ),
                // Update related expenses in local state to avoid stale data
                expenses: state.expenses.map((e) => 
                    e.category_id === id 
                        ? { ...e, categories: { name: data.name, color_code: data.color_code } }
                        : e
                )
            }))
            return { success: true, data }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    deleteCategory: async (id) => {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id)

            if (error) throw error
            set((state) => ({
                categories: state.categories.filter((c) => c.id !== id),
                categoryBudgets: state.categoryBudgets.filter((b) => b.category_id !== id),
                // Update related expenses to reflect category deletion (SET NULL behavior)
                expenses: state.expenses.map((e) => 
                    e.category_id === id 
                        ? { ...e, category_id: null, categories: null }
                        : e
                )
            }))
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    // Category budget actions
    fetchCategoryBudgets: async (userId) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('category_budgets')
                .select('*')
                .eq('user_id', userId)
                .order('budget_month', { ascending: false })

            if (error) throw error
            set({ categoryBudgets: data || [], isLoading: false })
        } catch (error) {
            // Graceful fallback if the table hasn't been added yet
            if (
                error.message?.includes('category_budgets') &&
                (error.message?.includes('does not exist') || error.message?.includes('schema cache'))
            ) {
                set({ categoryBudgets: [], isLoading: false })
                return
            }

            set({ error: error.message, isLoading: false })
        }
    },

    upsertCategoryBudget: async (budget) => {
        try {
            const { data, error } = await supabase
                .from('category_budgets')
                .upsert(budget, { onConflict: 'user_id,category_id,budget_month' })
                .select()
                .single()

            if (error) throw error

            set((state) => {
                const next = state.categoryBudgets.filter((b) => !(
                    b.user_id === data.user_id &&
                    b.category_id === data.category_id &&
                    b.budget_month === data.budget_month
                ))

                return {
                    categoryBudgets: [data, ...next]
                }
            })

            return { success: true, data }
        } catch (error) {
            // Graceful fallback if the table hasn't been added yet
            if (
                error.message?.includes('category_budgets') &&
                (error.message?.includes('does not exist') || error.message?.includes('schema cache'))
            ) {
                return {
                    success: false,
                    error: "Category budgets are not available because the database hasn't been updated yet."
                }
            }

            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    // Expense actions
    fetchExpenses: async (userId) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*, categories(name, color_code)')
                .eq('user_id', userId)
                .order('date', { ascending: false })

            if (error) throw error
            set({ expenses: data || [], isLoading: false })
        } catch (error) {
            set({ error: error.message, isLoading: false })
        }
    },

    addExpense: async (expense) => {
        const insertExpense = async (payload) => {
            return await supabase
                .from('expenses')
                .insert(payload)
                .select('*, categories(name, color_code)')
                .single()
        }

        try {
            // Prepare payload: remove exclude_from_limit if false
            const payload = { ...expense }
            if (!payload.exclude_from_limit) {
                delete payload.exclude_from_limit
            }

            const { data, error } = await insertExpense(payload)

            if (error) throw error
            
            set((state) => ({
                expenses: [data, ...state.expenses],
            }))
            return { success: true, data }
        } catch (error) {
            // Fallback: If error is about the missing column, retry without it
            if (error.message.includes('exclude_from_limit') && error.message.includes('column')) {
                try {
                    const fallbackPayload = { ...expense }
                    delete fallbackPayload.exclude_from_limit
                    
                    const { data, error: retryError } = await insertExpense(fallbackPayload)
                    
                    if (retryError) throw retryError

                    set((state) => ({
                        expenses: [data, ...state.expenses],
                    }))
                    
                    return { 
                        success: true, 
                        data, 
                        warning: "Expense added, but 'Exclude from limit' setting was ignored because the database has not been updated." 
                    }
                } catch (retryError) {
                    set({ error: retryError.message })
                    return { success: false, error: retryError.message }
                }
            }

            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    deleteExpense: async (id) => {
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)

            if (error) throw error
            set((state) => ({
                expenses: state.expenses.filter((e) => e.id !== id),
            }))
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    // Debt actions
    fetchDebts: async (userId) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('debts')
                .select('*')
                .eq('user_id', userId)

            if (error) throw error
            set({ debts: data || [], isLoading: false })
        } catch (error) {
            set({ error: error.message, isLoading: false })
        }
    },

    addDebt: async (debt) => {
        try {
            const { data, error } = await supabase
                .from('debts')
                .insert(debt)
                .select()
                .single()

            if (error) throw error
            set((state) => ({
                debts: [...state.debts, data],
            }))
            return { success: true, data }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    updateDebt: async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('debts')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            set((state) => ({
                debts: state.debts.map((d) =>
                    d.id === id ? data : d
                ),
            }))
            return { success: true, data }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    deleteDebt: async (id) => {
        try {
            const { error } = await supabase
                .from('debts')
                .delete()
                .eq('id', id)

            if (error) throw error
            set((state) => ({
                debts: state.debts.filter((d) => d.id !== id),
            }))
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    // Savings actions
    fetchSavingsTransactions: async (userId) => {
        set({ isLoading: true, error: null, savingsTransactionsLoaded: false })
        try {
            const { data, error } = await supabase
                .from('savings_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error

            set({
                savingsTransactions: data || [],
                savingsTransactionsLoaded: true,
                isLoading: false
            })
        } catch (error) {
            if (isMissingTableError(error, 'savings_transactions')) {
                set({
                    savingsTransactions: [],
                    savingsTransactionsLoaded: true,
                    isLoading: false
                })
                return
            }

            set({
                error: error.message,
                savingsTransactionsLoaded: true,
                isLoading: false
            })
        }
    },

    addSavingsTransaction: async (transaction) => {
        try {
            const { data, error } = await supabase
                .from('savings_transactions')
                .insert(transaction)
                .select()
                .single()

            if (error) throw error

            set((state) => ({
                savingsTransactions: [data, ...state.savingsTransactions]
            }))

            return { success: true, data }
        } catch (error) {
            if (isMissingTableError(error, 'savings_transactions')) {
                return {
                    success: false,
                    error: "Savings is not available because the database hasn't been updated yet."
                }
            }

            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    deleteSavingsTransaction: async (id) => {
        try {
            const { error } = await supabase
                .from('savings_transactions')
                .delete()
                .eq('id', id)

            if (error) throw error

            set((state) => ({
                savingsTransactions: state.savingsTransactions.filter((tx) => tx.id !== id)
            }))

            return { success: true }
        } catch (error) {
            if (isMissingTableError(error, 'savings_transactions')) {
                return {
                    success: false,
                    error: "Savings is not available because the database hasn't been updated yet."
                }
            }

            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    fetchMonthlySavingsRollovers: async (userId) => {
        set({ isLoading: true, error: null, monthlySavingsRolloversLoaded: false })
        try {
            const { data, error } = await supabase
                .from('monthly_savings_rollovers')
                .select('*')
                .eq('user_id', userId)
                .order('rollover_month', { ascending: false })

            if (error) throw error

            set({
                monthlySavingsRollovers: data || [],
                monthlySavingsRolloversLoaded: true,
                isLoading: false
            })
        } catch (error) {
            if (isMissingTableError(error, 'monthly_savings_rollovers')) {
                set({
                    monthlySavingsRollovers: [],
                    monthlySavingsRolloversLoaded: true,
                    isLoading: false
                })
                return
            }

            set({
                error: error.message,
                monthlySavingsRolloversLoaded: true,
                isLoading: false
            })
        }
    },

    upsertMonthlySavingsRollover: async (row) => {
        try {
            const { data, error } = await supabase
                .from('monthly_savings_rollovers')
                .upsert(row, { onConflict: 'user_id,rollover_month' })
                .select()
                .single()

            if (error) throw error

            set((state) => {
                const next = state.monthlySavingsRollovers.filter((r) => !(
                    r.user_id === data.user_id && r.rollover_month === data.rollover_month
                ))

                return {
                    monthlySavingsRollovers: [data, ...next]
                }
            })

            return { success: true, data }
        } catch (error) {
            if (isMissingTableError(error, 'monthly_savings_rollovers')) {
                return {
                    success: false,
                    error: "Savings rollover tracking is not available because the database hasn't been updated yet."
                }
            }

            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    fetchWeeklyLimitCarryovers: async (userId) => {
        set({ isLoading: true, error: null, weeklyLimitCarryoversLoaded: false })
        try {
            const { data, error } = await supabase
                .from('weekly_limit_carryovers')
                .select('*')
                .eq('user_id', userId)
                .order('rollover_month', { ascending: false })

            if (error) throw error

            set({
                weeklyLimitCarryovers: data || [],
                weeklyLimitCarryoversLoaded: true,
                isLoading: false
            })
        } catch (error) {
            if (isMissingTableError(error, 'weekly_limit_carryovers')) {
                set({
                    weeklyLimitCarryovers: [],
                    weeklyLimitCarryoversLoaded: true,
                    isLoading: false
                })
                return
            }

            set({
                error: error.message,
                weeklyLimitCarryoversLoaded: true,
                isLoading: false
            })
        }
    },

    upsertWeeklyLimitCarryover: async (row) => {
        try {
            const { data, error } = await supabase
                .from('weekly_limit_carryovers')
                .upsert(row, { onConflict: 'user_id,rollover_month' })
                .select()
                .single()

            if (error) throw error

            set((state) => {
                const next = state.weeklyLimitCarryovers.filter((r) => !(
                    r.user_id === data.user_id && r.rollover_month === data.rollover_month
                ))

                return {
                    weeklyLimitCarryovers: [data, ...next]
                }
            })

            return { success: true, data }
        } catch (error) {
            if (isMissingTableError(error, 'weekly_limit_carryovers')) {
                return {
                    success: false,
                    error: "Weekly carryover tracking is not available because the database hasn't been updated yet."
                }
            }

            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    ensureCurrentMonthWeeklyCarryover: async ({ userId, referenceDate = new Date() }) => {
        try {
            if (!userId) {
                return { success: false, error: 'Not authenticated' }
            }

            const {
                fetchWeeklyLimitCarryovers,
                upsertWeeklyLimitCarryover,
                weeklyLimitCarryoversLoaded
            } = get()

            if (!weeklyLimitCarryoversLoaded) {
                await fetchWeeklyLimitCarryovers(userId)
            }

            const state = get()
            const payload = buildCurrentMonthWeeklyCarryover({
                userId,
                incomeSources: state.incomeSources,
                expenses: state.expenses,
                categories: state.categories,
                categoryBudgets: state.categoryBudgets,
                weeklyLimitCarryovers: state.weeklyLimitCarryovers,
                referenceDate
            })

            if (!payload.previousMonthUpdate && !payload.currentMonthRow) {
                return { success: true, data: payload }
            }

            if (payload.previousMonthUpdate) {
                const previousResult = await upsertWeeklyLimitCarryover(payload.previousMonthUpdate)
                if (!previousResult.success) return previousResult
            }

            if (payload.currentMonthRow) {
                const currentResult = await upsertWeeklyLimitCarryover(payload.currentMonthRow)
                if (!currentResult.success) return currentResult
            }

            return { success: true, data: payload }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    // Utility actions
    clearError: () => set({ error: null }),

    // Fetch all data for a user
    fetchAllData: async (userId) => {
        const {
            fetchProfile,
            fetchIncomeSources,
            fetchCategories,
            fetchCategoryBudgets,
            fetchExpenses,
            fetchDebts,
            fetchSavingsTransactions,
            fetchMonthlySavingsRollovers,
            fetchWeeklyLimitCarryovers
        } = get()
        await Promise.all([
            fetchProfile(userId),
            fetchIncomeSources(userId),
            fetchCategories(userId),
            fetchCategoryBudgets(userId),
            fetchExpenses(userId),
            fetchDebts(userId),
            fetchSavingsTransactions(userId),
            fetchMonthlySavingsRollovers(userId),
            fetchWeeklyLimitCarryovers(userId),
        ])
    },
}))

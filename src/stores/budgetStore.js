import { create } from 'zustand'
import { supabase } from '../services/supabase/supabase'

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

export const useBudgetStore = create((set, get) => ({
    // State
    profile: null,
    incomeSources: [],
    categories: [],
    expenses: [],
    debts: [],
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
            }))
            return { success: true }
        } catch (error) {
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
        try {
            const { data, error } = await supabase
                .from('expenses')
                .insert(expense)
                .select('*, categories(name, color_code)')
                .single()

            if (error) throw error
            set((state) => ({
                expenses: [data, ...state.expenses],
            }))
            return { success: true, data }
        } catch (error) {
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

    // Utility actions
    clearError: () => set({ error: null }),

    // Fetch all data for a user
    fetchAllData: async (userId) => {
        const { fetchProfile, fetchIncomeSources, fetchCategories, fetchExpenses, fetchDebts } = get()
        await Promise.all([
            fetchProfile(userId),
            fetchIncomeSources(userId),
            fetchCategories(userId),
            fetchExpenses(userId),
            fetchDebts(userId),
        ])
    },
}))

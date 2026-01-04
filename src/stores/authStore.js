import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../services/supabase/supabase'
import { onAuthStateChange, getSession, signIn, signUp, signOut } from '../services/supabase/auth'

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isLoading
 * @property {boolean} isAuthenticated
 * @property {string|null} error
 * @property {boolean} isConfigured
 * @property {function} initialize
 * @property {function} login
 * @property {function} register
 * @property {function} logout
 * @property {function} clearError
 */

export const useAuthStore = create((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    isConfigured: isSupabaseConfigured,

    /**
     * Initialize auth state by checking current session
     */
    initialize: async () => {
        // If Supabase is not configured, just stop loading and show login
        if (!isSupabaseConfigured) {
            set({
                isLoading: false,
                error: 'Supabase not configured. Please add credentials to .env file.',
            })
            return
        }

        try {
            const { data, error } = await getSession()
            if (error) throw error

            const user = data?.session?.user ?? null
            set({
                user,
                isAuthenticated: !!user,
                isLoading: false,
            })

            // Listen for auth state changes
            onAuthStateChange((event, session) => {
                const user = session?.user ?? null
                set({
                    user,
                    isAuthenticated: !!user,
                })
            })
        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
            })
        }
    },

    /**
     * Login with email and password
     * @param {string} email
     * @param {string} password
     */
    login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await signIn(email, password)
            if (error) throw error

            set({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
            })
            return { success: true }
        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
            })
            return { success: false, error: error.message }
        }
    },

    /**
     * Register a new user
     * @param {string} email
     * @param {string} password
     */
    register: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await signUp(email, password)
            if (error) throw error

            set({
                user: data.user,
                isAuthenticated: !!data.session,
                isLoading: false,
            })
            return { success: true, needsConfirmation: !data.session }
        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
            })
            return { success: false, error: error.message }
        }
    },

    /**
     * Logout the current user
     */
    logout: async () => {
        set({ isLoading: true })
        try {
            const { error } = await signOut()
            if (error) throw error

            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
            })
        }
    },

    /**
     * Clear any error messages
     */
    clearError: () => set({ error: null }),
}))

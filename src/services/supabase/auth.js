import { supabase } from './supabase'

/**
 * Sign up a new user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })
    return { data, error }
}

/**
 * Sign in an existing user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    return { data, error }
}

/**
 * Sign out the current user
 * @returns {Promise<{error: any}>}
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
}

/**
 * Get the current session
 * @returns {Promise<{data: any, error: any}>}
 */
export async function getSession() {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
}

/**
 * Get the current user
 * @returns {Promise<{data: any, error: any}>}
 */
export async function getUser() {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
}

/**
 * Listen for auth state changes
 * @param {function} callback 
 * @returns {object} Subscription object with unsubscribe method
 */
export function onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
            callback(event, session)
        }
    )
    return subscription
}

/**
 * Reset password for a user
 * @param {string} email 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
}

/**
 * Update user password
 * @param {string} newPassword 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    })
    return { data, error }
}

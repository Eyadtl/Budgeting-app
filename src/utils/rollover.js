/**
 * Rollover utilities for monthly budget transitions
 */

const STORAGE_KEY = 'budget_last_visit'

/**
 * Check if we've entered a new month since last visit
 * @returns {{ isNewMonth: boolean, lastMonth: number|null, lastYear: number|null }}
 */
export function checkMonthRollover() {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const lastVisit = localStorage.getItem(STORAGE_KEY)

    if (!lastVisit) {
        // First visit - save current date
        saveLastVisit()
        return { isNewMonth: false, lastMonth: null, lastYear: null }
    }

    const { month: lastMonth, year: lastYear } = JSON.parse(lastVisit)

    // Check if month or year has changed
    const isNewMonth = currentMonth !== lastMonth || currentYear !== lastYear

    return { isNewMonth, lastMonth, lastYear }
}

/**
 * Save current visit date to local storage
 */
export function saveLastVisit() {
    const now = new Date()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        month: now.getMonth(),
        year: now.getFullYear()
    }))
}

/**
 * Mark rollover as acknowledged (updates last visit)
 */
export function acknowledgeRollover() {
    saveLastVisit()
}

/**
 * Get recurring income templates
 * @param {Array} incomeSources 
 * @returns {Array}
 */
export function getRecurringIncomeTemplates(incomeSources) {
    return incomeSources.filter(income => income.frequency === 'recurring')
}

/**
 * Get recurring expense templates
 * @param {Array} expenses 
 * @returns {Array}
 */
export function getRecurringExpenseTemplates(expenses) {
    return expenses.filter(expense => expense.is_recurring)
}

/**
 * Create a new instance of a recurring item for a new month
 * @param {Object} template - The recurring item template
 * @param {Date} newDate - The date for the new instance
 * @returns {Object}
 */
export function createMonthlyInstance(template, newDate = new Date()) {
    const { id, created_at, updated_at, ...rest } = template

    const dateStr = newDate.toISOString().split('T')[0]

    return {
        ...rest,
        date: dateStr
    }
}

/**
 * Calculate remaining category balances
 * @param {Array} categories 
 * @param {Array} expenses 
 * @returns {Array} Categories with remaining balance
 */
export function calculateRemainingBalances(categories, expenses) {
    return categories.map(category => {
        const categoryExpenses = expenses.filter(e => e.category_id === category.id)
        const spent = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
        const remaining = category.budget_limit - spent

        return {
            ...category,
            spent,
            remaining
        }
    })
}

/**
 * Weekly Spending Limit Utility Functions
 * Calculates weekly spending limits based on remaining monthly income
 */

/**
 * Calculate the total number of weeks in the current month
 * using a fixed calendar divisor for stability during the month.
 * @returns {number} Weeks in month (minimum 1)
 */
export function getWeeksInCurrentMonth() {
    const now = new Date()
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()
    return Math.max(1, Math.ceil(daysInMonth / 7))
}

/**
 * Calculate days remaining in the current week (Mon-Sun)
 * @returns {number} Days remaining in week (1-7)
 */
export function getDaysRemainingInWeek() {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday
    // Convert to Mon=1, Sun=7 format
    const mondayBased = dayOfWeek === 0 ? 7 : dayOfWeek
    return 7 - mondayBased + 1
}

/**
 * Calculate the weekly spending limit.
 * Uses a stable month-level divisor so the limit only changes
 * when income or expenses change (not every day).
 * @param {number} totalIncome - Total monthly income
 * @param {number} totalExpenses - Actual expenses spent this month
 * @returns {number} Weekly limit amount
 */
export function calculateWeeklyLimit(totalIncome, totalExpenses) {
    const remaining = totalIncome - totalExpenses
    if (remaining <= 0) return 0
    const weeksInMonth = getWeeksInCurrentMonth()
    return remaining / weeksInMonth
}

/**
 * Calculate pro-rated limit for current week
 * @param {number} weeklyLimit - Full weekly limit
 * @returns {number} Pro-rated amount for remaining days
 */
export function calculateProRatedWeeklyLimit(weeklyLimit) {
    const daysRemaining = getDaysRemainingInWeek()
    return (weeklyLimit / 7) * daysRemaining
}

/**
 * Get spending status based on current week spending vs limit
 * @param {number} spent - Amount spent this week
 * @param {number} limit - Weekly limit (pro-rated)
 * @returns {'safe'|'warning'|'exceeded'}
 */
export function getWeeklySpendingStatus(spent, limit) {
    if (limit <= 0) return 'exceeded'
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return 'exceeded'
    if (percentage >= 75) return 'warning'
    return 'safe'
}

/**
 * Get the start of the current week (Monday at 00:00:00)
 * @returns {Date} Monday of the current week
 */
export function getStartOfWeek() {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.getFullYear(), now.getMonth(), diff)
    monday.setHours(0, 0, 0, 0)
    return monday
}

/**
 * Weekly Spending Limit Utility Functions
 * Calculates weekly spending limits from remaining monthly income
 */

/**
 * Get the start of the current week (Monday at 00:00:00)
 * @param {Date} [referenceDate]
 * @returns {Date} Monday of the current week
 */
export function getStartOfWeek(referenceDate = new Date()) {
    const now = referenceDate
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.getFullYear(), now.getMonth(), diff)
    monday.setHours(0, 0, 0, 0)
    return monday
}

/**
 * Calculate days remaining in the current week (Mon-Sun)
 * @param {Date} [referenceDate]
 * @returns {number} Days remaining in week (1-7)
 */
export function getDaysRemainingInWeek(referenceDate = new Date()) {
    const now = referenceDate
    const dayOfWeek = now.getDay() // 0 = Sunday
    // Convert to Mon=1, Sun=7 format
    const mondayBased = dayOfWeek === 0 ? 7 : dayOfWeek
    return 7 - mondayBased + 1
}

/**
 * Calculate remaining weeks in the current month from this week boundary.
 * This stays stable during the week and updates when a new week starts.
 * @param {Date} [referenceDate]
 * @returns {number} Weeks remaining in current month (minimum 1)
 */
export function getWeeksRemainingInCurrentMonth(referenceDate = new Date()) {
    const now = referenceDate
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const weekStart = getStartOfWeek(now)
    const effectiveStart = weekStart < monthStart ? monthStart : weekStart

    const msPerDay = 24 * 60 * 60 * 1000
    const daysRemaining = Math.floor((monthEnd - effectiveStart) / msPerDay) + 1

    return Math.max(1, Math.ceil(daysRemaining / 7))
}

/**
 * Calculate the weekly spending limit.
 * @param {number} startingPool - Current monthly pool available for weekly planning
 * @param {number} poolAdjustments - Expense adjustments that should reduce weekly pool
 * @param {Date} [referenceDate]
 * @returns {number} Weekly limit amount
 */
export function calculateWeeklyLimit(startingPool, poolAdjustments = 0, referenceDate = new Date()) {
    const remaining = startingPool - poolAdjustments
    if (remaining <= 0) return 0
    const weeksRemaining = getWeeksRemainingInCurrentMonth(referenceDate)
    return remaining / weeksRemaining
}

/**
 * Calculate pro-rated limit for current week
 * @param {number} weeklyLimit - Full weekly limit
 * @param {Date} [referenceDate]
 * @returns {number} Pro-rated amount for remaining days
 */
export function calculateProRatedWeeklyLimit(weeklyLimit, referenceDate = new Date()) {
    const daysRemaining = getDaysRemainingInWeek(referenceDate)
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


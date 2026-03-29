/**
 * Weekly Spending Limit Utility Functions
 * Calculates weekly spending limits from remaining monthly income
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function daysBetweenInclusive(start, end) {
    return Math.floor((startOfDay(end) - startOfDay(start)) / MS_PER_DAY) + 1
}

function getMonthBounds(referenceDate = new Date()) {
    return {
        monthStart: new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
        monthEnd: new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)
    }
}

function clampToMonthEnd(date, monthEnd) {
    return date > monthEnd ? monthEnd : date
}

function isSameOrBefore(left, right) {
    return left.getTime() <= right.getTime()
}

/**
 * Get the start of the current week (Sunday at 00:00:00)
 * @param {Date} [referenceDate]
 * @returns {Date} Sunday of the current week
 */
export function getStartOfWeek(referenceDate = new Date()) {
    const now = referenceDate
    const day = now.getDay()
    const diff = now.getDate() - day
    const sunday = new Date(now.getFullYear(), now.getMonth(), diff)
    sunday.setHours(0, 0, 0, 0)
    return sunday
}

/**
 * Calculate days remaining in the current week (Sun-Sat)
 * @param {Date} [referenceDate]
 * @returns {number} Days remaining in week (1-7)
 */
export function getDaysRemainingInWeek(referenceDate = new Date()) {
    const now = referenceDate
    const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
    return 7 - dayOfWeek
}

/**
 * Build the month-bounded budgeting periods for a month.
 * The first period starts on the 1st of the month and ends on Saturday.
 * Subsequent periods run Sunday-Saturday, with the last period capped at month end.
 * @param {number} year
 * @param {number} monthIndex
 * @returns {Array<{start: Date, end: Date, totalDays: number}>}
 */
export function getBudgetPeriodsForMonthParts(year, monthIndex) {
    const monthStart = new Date(year, monthIndex, 1)
    const monthEnd = new Date(year, monthIndex + 1, 0)
    const periods = []

    let cursor = monthStart
    while (isSameOrBefore(cursor, monthEnd)) {
        const start = startOfDay(cursor)
        const daysUntilSaturday = 6 - start.getDay()
        const end = clampToMonthEnd(addDays(start, daysUntilSaturday), monthEnd)

        periods.push({
            start,
            end,
            totalDays: daysBetweenInclusive(start, end)
        })

        cursor = addDays(end, 1)
    }

    return periods
}

/**
 * Build the month-bounded budgeting periods for a reference month.
 * @param {Date} [referenceDate]
 * @returns {Array<{start: Date, end: Date, totalDays: number}>}
 */
export function getBudgetPeriodsForMonth(referenceDate = new Date()) {
    return getBudgetPeriodsForMonthParts(referenceDate.getFullYear(), referenceDate.getMonth())
}

/**
 * Get the active month-bounded budgeting period for a date.
 * @param {Date} [referenceDate]
 * @returns {{start: Date, end: Date, totalDays: number, daysRemaining: number}}
 */
export function getCurrentBudgetPeriod(referenceDate = new Date()) {
    const target = startOfDay(referenceDate)
    const currentPeriod = getBudgetPeriodsForMonth(referenceDate).find((period) => (
        period.start.getTime() <= target.getTime() && period.end.getTime() >= target.getTime()
    ))

    if (!currentPeriod) {
        const { monthStart, monthEnd } = getMonthBounds(referenceDate)
        return {
            start: monthStart,
            end: monthEnd,
            totalDays: daysBetweenInclusive(monthStart, monthEnd),
            daysRemaining: daysBetweenInclusive(target, monthEnd)
        }
    }

    return {
        ...currentPeriod,
        daysRemaining: daysBetweenInclusive(target, currentPeriod.end)
    }
}

/**
 * Get the remaining month-bounded budgeting periods in the current month.
 * @param {Date} [referenceDate]
 * @returns {Array<{start: Date, end: Date, totalDays: number}>}
 */
export function getRemainingBudgetPeriodsInMonth(referenceDate = new Date()) {
    const target = startOfDay(referenceDate)
    const periods = getBudgetPeriodsForMonth(referenceDate)
    const currentIndex = periods.findIndex((period) => (
        period.start.getTime() <= target.getTime() && period.end.getTime() >= target.getTime()
    ))

    return currentIndex === -1 ? periods : periods.slice(currentIndex)
}

export function getDaysRemainingInCurrentBudgetPeriod(referenceDate = new Date()) {
    return getCurrentBudgetPeriod(referenceDate).daysRemaining
}

export function getBudgetPeriodWeight(period) {
    return (period?.totalDays || 0) / 7
}

/**
 * Count the remaining month-bounded budget periods in the current month.
 * This stays stable during the current period and updates on the next reset.
 * @param {Date} [referenceDate]
 * @returns {number} Remaining budget periods in current month (minimum 1)
 */
export function getWeeksRemainingInCurrentMonth(referenceDate = new Date()) {
    return Math.max(1, getRemainingBudgetPeriodsInMonth(referenceDate).length)
}

/**
 * Calculate the current period spending limit.
 * @param {number} startingPool - Current monthly pool available for weekly planning
 * @param {number} poolAdjustments - Expense adjustments that should reduce weekly pool
 * @param {Date} [referenceDate]
 * @returns {number} Current period limit amount
 */
export function calculateWeeklyLimit(startingPool, poolAdjustments = 0, referenceDate = new Date()) {
    const remaining = startingPool - poolAdjustments
    if (remaining <= 0) return 0
    const remainingPeriods = getRemainingBudgetPeriodsInMonth(referenceDate)
    const currentPeriod = remainingPeriods[0]
    const remainingPeriodCount = remainingPeriods.length

    if (!currentPeriod || remainingPeriodCount <= 0) return 0

    const baseWeeklyLimit = remaining / remainingPeriodCount
    return baseWeeklyLimit * getBudgetPeriodWeight(currentPeriod)
}

/**
 * Calculate the remaining-day pro-rated limit inside the current period.
 * @param {number} weeklyLimit - Full current period limit
 * @param {Date} [referenceDate]
 * @returns {number} Pro-rated amount for remaining days
 */
export function calculateProRatedWeeklyLimit(weeklyLimit, referenceDate = new Date()) {
    const currentPeriod = getCurrentBudgetPeriod(referenceDate)
    if (currentPeriod.totalDays <= 0) return 0
    return (weeklyLimit / currentPeriod.totalDays) * currentPeriod.daysRemaining
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


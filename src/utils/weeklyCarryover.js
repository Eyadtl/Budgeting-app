import { calculateWeeklyLimit, getStartOfWeek } from './weeklyLimit'

export const WEEKLY_LIMIT_CARRYOVER_STATUSES = {
    pending: 'pending',
    applied: 'applied',
    settled: 'settled'
}

const TWO_DECIMAL_PLACES = 100

function toAmount(value) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function roundCurrency(value) {
    return Math.round(toAmount(value) * TWO_DECIMAL_PLACES) / TWO_DECIMAL_PLACES
}

function parseDateInput(date) {
    if (date instanceof Date) return date

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number)
        return new Date(year, month - 1, day)
    }

    return new Date(date)
}

function toMonthKeyFromParts(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function toMonthKey(date) {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date.slice(0, 7)

    const parsed = parseDateInput(date)
    return toMonthKeyFromParts(parsed.getFullYear(), parsed.getMonth())
}

function hasCategory(categoryId) {
    return categoryId !== null && categoryId !== undefined && categoryId !== ''
}

function isDebtPaymentExpense(expense) {
    return Boolean(expense?.name && expense.name.startsWith('Debt Payment:'))
}

function isExcludedExpense(expense) {
    return expense?.exclude_from_limit === true
}

function isCategorizedExpense(expense) {
    return hasCategory(expense?.category_id)
}

function isPaidExpense(expense) {
    return toAmount(expense?.amount) > 0
}

function isWeeklyTrackedExpense(expense) {
    return !isDebtPaymentExpense(expense)
        && !isExcludedExpense(expense)
        && !isCategorizedExpense(expense)
}

function shouldReduceWeeklyPool(expense, weekStartMs, monthEndMs) {
    if (!isPaidExpense(expense)) return false
    if (isDebtPaymentExpense(expense)) return false
    if (isCategorizedExpense(expense)) return false

    const expenseDateMs = parseDateInput(expense.date).getTime()
    if (!Number.isFinite(expenseDateMs)) return false
    if (expenseDateMs > monthEndMs) return false

    const isBeforeWeek = expenseDateMs < weekStartMs
    return isBeforeWeek || isExcludedExpense(expense)
}

function filterByMonth(items, month, year) {
    return items.filter((item) => {
        const date = parseDateInput(item?.date)
        return date.getMonth() === month && date.getFullYear() === year
    })
}

function sumByAmount(items) {
    return roundCurrency(items.reduce((sum, item) => sum + toAmount(item?.amount), 0))
}

function getMonthEnd(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0)
}

function calculateMonthTotalBudgeted({
    categories = [],
    categoryBudgets = [],
    month,
    year
}) {
    const monthKey = toMonthKeyFromParts(year, month)
    const monthEnd = getMonthEnd(year, month)
    const budgetMap = new Map()

    for (const budget of categoryBudgets) {
        if (!budget?.category_id || !budget?.budget_month) continue
        if (toMonthKey(budget.budget_month) !== monthKey) continue
        budgetMap.set(budget.category_id, toAmount(budget.amount))
    }

    return roundCurrency(
        categories.reduce((sum, category) => {
            const createdAt = category?.created_at ? parseDateInput(category.created_at) : null
            if (createdAt && createdAt > monthEnd) return sum

            const budgeted = budgetMap.has(category.id)
                ? budgetMap.get(category.id)
                : toAmount(category?.budget_limit)

            return sum + budgeted
        }, 0)
    )
}

function calculateMonthDebtPayments(expenses = []) {
    return roundCurrency(
        expenses
            .filter((expense) => isDebtPaymentExpense(expense) && !hasCategory(expense?.category_id))
            .reduce((sum, expense) => sum + toAmount(expense.amount), 0)
    )
}

export function getMonthStartString(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
}

export function getMonthParts(referenceDate = new Date()) {
    return {
        month: referenceDate.getMonth(),
        year: referenceDate.getFullYear()
    }
}

export function getPreviousMonthParts(referenceDate = new Date()) {
    const { month, year } = getMonthParts(referenceDate)
    if (month === 0) {
        return { month: 11, year: year - 1 }
    }
    return { month: month - 1, year }
}

export function findWeeklyLimitCarryover(weeklyLimitCarryovers = [], rolloverMonth) {
    return weeklyLimitCarryovers.find((row) => row?.rollover_month === rolloverMonth) || null
}

export function calculateEffectiveMonthlyIncome(grossIncome, carryoverDeduction = 0) {
    return roundCurrency(Math.max(0, toAmount(grossIncome) - toAmount(carryoverDeduction)))
}

export function calculateRemainingCarryoverAmount(carryoverAmount, grossIncome) {
    return roundCurrency(Math.max(0, toAmount(carryoverAmount) - toAmount(grossIncome)))
}

export function getCarryoverDeductionForMonth(weeklyLimitCarryovers = [], rolloverMonth) {
    return roundCurrency(toAmount(findWeeklyLimitCarryover(weeklyLimitCarryovers, rolloverMonth)?.carryover_amount))
}

export function calculateFinalWeekOverrunForMonth({
    incomeSources = [],
    expenses = [],
    categories = [],
    categoryBudgets = [],
    month,
    year,
    carryoverDeduction = 0
}) {
    const monthExpenses = filterByMonth(expenses, month, year)
    const monthIncome = sumByAmount(filterByMonth(incomeSources, month, year))
    const effectiveIncome = calculateEffectiveMonthlyIncome(monthIncome, carryoverDeduction)
    const totalBudgeted = calculateMonthTotalBudgeted({
        categories,
        categoryBudgets,
        month,
        year
    })
    const monthlyDebtPayments = calculateMonthDebtPayments(monthExpenses)
    const remainingAfterAssigned = roundCurrency(effectiveIncome - totalBudgeted - monthlyDebtPayments)
    const startingPool = Math.max(0, remainingAfterAssigned)

    const monthEnd = getMonthEnd(year, month)
    const weekStartMs = getStartOfWeek(monthEnd).getTime()
    const monthEndForRange = new Date(monthEnd)
    monthEndForRange.setHours(23, 59, 59, 999)
    const monthEndMs = monthEndForRange.getTime()

    const spentThisWeek = roundCurrency(
        monthExpenses
            .filter((expense) => {
                const expenseDateMs = parseDateInput(expense.date).getTime()
                return expenseDateMs >= weekStartMs && isWeeklyTrackedExpense(expense)
            })
            .reduce((sum, expense) => sum + toAmount(expense.amount), 0)
    )

    const paidImpactForWeeklyPool = roundCurrency(
        monthExpenses
            .filter((expense) => shouldReduceWeeklyPool(expense, weekStartMs, monthEndMs))
            .reduce((sum, expense) => sum + toAmount(expense.amount), 0)
    )

    const weeklyLimit = roundCurrency(
        calculateWeeklyLimit(startingPool, paidImpactForWeeklyPool, monthEnd)
    )

    return {
        weekStart: new Date(weekStartMs),
        monthEnd,
        monthIncome,
        effectiveIncome,
        totalBudgeted,
        monthlyDebtPayments,
        remainingAfterAssigned,
        startingPool: roundCurrency(startingPool),
        paidImpactForWeeklyPool,
        spentThisWeek,
        weeklyLimit,
        overrun: roundCurrency(Math.max(0, spentThisWeek - weeklyLimit))
    }
}

export function buildCurrentMonthWeeklyCarryover({
    userId,
    incomeSources = [],
    expenses = [],
    categories = [],
    categoryBudgets = [],
    weeklyLimitCarryovers = [],
    referenceDate = new Date()
}) {
    const { month: rolloverMonthIndex, year: rolloverYear } = getMonthParts(referenceDate)
    const { month: sourceMonthIndex, year: sourceYear } = getPreviousMonthParts(referenceDate)
    const rolloverMonth = getMonthStartString(rolloverYear, rolloverMonthIndex)
    const sourceMonth = getMonthStartString(sourceYear, sourceMonthIndex)
    const nowIso = new Date().toISOString()

    const sourceCarryoverRow = findWeeklyLimitCarryover(weeklyLimitCarryovers, sourceMonth)
    const sourceCarryoverAmount = roundCurrency(toAmount(sourceCarryoverRow?.carryover_amount))
    const sourceIncomeTotal = sumByAmount(filterByMonth(incomeSources, sourceMonthIndex, sourceYear))
    const sourceRemainingAmount = calculateRemainingCarryoverAmount(sourceCarryoverAmount, sourceIncomeTotal)

    const sourceFinalWeek = calculateFinalWeekOverrunForMonth({
        incomeSources,
        expenses,
        categories,
        categoryBudgets,
        month: sourceMonthIndex,
        year: sourceYear,
        carryoverDeduction: sourceCarryoverAmount
    })

    const currentCarryoverAmount = roundCurrency(sourceRemainingAmount + sourceFinalWeek.overrun)
    const existingCurrentMonthRow = findWeeklyLimitCarryover(weeklyLimitCarryovers, rolloverMonth)

    const previousMonthUpdate = sourceCarryoverRow
        ? {
            user_id: userId,
            rollover_month: sourceMonth,
            source_month: sourceCarryoverRow.source_month,
            carryover_amount: sourceCarryoverAmount,
            remaining_amount: sourceRemainingAmount,
            status: sourceRemainingAmount > 0
                ? WEEKLY_LIMIT_CARRYOVER_STATUSES.applied
                : WEEKLY_LIMIT_CARRYOVER_STATUSES.settled,
            processed_at: nowIso
        }
        : null

    let currentMonthRow = null
    if (currentCarryoverAmount > 0 || existingCurrentMonthRow) {
        currentMonthRow = {
            user_id: userId,
            rollover_month: rolloverMonth,
            source_month: sourceMonth,
            carryover_amount: currentCarryoverAmount,
            remaining_amount: currentCarryoverAmount,
            status: currentCarryoverAmount > 0
                ? WEEKLY_LIMIT_CARRYOVER_STATUSES.pending
                : WEEKLY_LIMIT_CARRYOVER_STATUSES.settled,
            processed_at: currentCarryoverAmount > 0 ? null : nowIso
        }
    }

    return {
        rolloverMonth,
        sourceMonth,
        sourceCarryoverAmount,
        sourceIncomeTotal,
        sourceRemainingAmount,
        sourceFinalWeekOverrun: sourceFinalWeek.overrun,
        currentCarryoverAmount,
        previousMonthUpdate,
        currentMonthRow
    }
}


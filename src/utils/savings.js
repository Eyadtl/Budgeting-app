import { filterByMonth } from './index'

export const SAVINGS_ROLLOVER_STATUSES = {
    pending: 'pending',
    accepted: 'accepted',
    skipped: 'skipped'
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
    const current = getMonthParts(referenceDate)
    if (current.month === 0) {
        return { month: 11, year: current.year - 1 }
    }

    return { month: current.month - 1, year: current.year }
}

export function calculateSavingsBalance(transactions = []) {
    return transactions.reduce((sum, tx) => sum + Number(tx?.signed_amount || 0), 0)
}

export function calculateSetSavingsBalanceDelta(currentBalance, targetBalance) {
    return Number(targetBalance || 0) - Number(currentBalance || 0)
}

export function calculateMonthCashSurplus({
    incomeSources = [],
    expenses = [],
    month,
    year
}) {
    const monthIncome = filterByMonth(incomeSources, month, year)
        .reduce((sum, item) => sum + Number(item?.amount || 0), 0)

    const monthExpenses = filterByMonth(expenses, month, year)
        .reduce((sum, item) => sum + Number(item?.amount || 0), 0)

    const rawSurplus = monthIncome - monthExpenses

    return {
        incomeTotal: monthIncome,
        expenseTotal: monthExpenses,
        rawSurplus,
        suggestedAmount: Math.max(0, rawSurplus)
    }
}

export function findMonthlySavingsRollover(monthlySavingsRollovers = [], rolloverMonth) {
    return monthlySavingsRollovers.find((row) => row?.rollover_month === rolloverMonth) || null
}

export function buildCurrentMonthSavingsRolloverPrompt({
    incomeSources = [],
    expenses = [],
    monthlySavingsRollovers = [],
    referenceDate = new Date()
}) {
    const { month: rolloverMonthIndex, year: rolloverYear } = getMonthParts(referenceDate)
    const { month: sourceMonthIndex, year: sourceYear } = getPreviousMonthParts(referenceDate)
    const rolloverMonth = getMonthStartString(rolloverYear, rolloverMonthIndex)
    const sourceMonth = getMonthStartString(sourceYear, sourceMonthIndex)

    const existingRecord = findMonthlySavingsRollover(monthlySavingsRollovers, rolloverMonth)
    if (existingRecord && [SAVINGS_ROLLOVER_STATUSES.accepted, SAVINGS_ROLLOVER_STATUSES.skipped].includes(existingRecord.status)) {
        return null
    }

    const { incomeTotal, expenseTotal, rawSurplus, suggestedAmount } = calculateMonthCashSurplus({
        incomeSources,
        expenses,
        month: sourceMonthIndex,
        year: sourceYear
    })

    if (suggestedAmount <= 0) return null

    return {
        rolloverMonth,
        sourceMonth,
        incomeTotal,
        expenseTotal,
        rawSurplus,
        suggestedAmount,
        existingRecord
    }
}


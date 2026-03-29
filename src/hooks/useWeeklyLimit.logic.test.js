import { describe, expect, it } from 'vitest'
import { isWeeklyTrackedExpense, shouldReduceWeeklyPool } from './useWeeklyLimit'
import { parseDate } from '../utils'

const periodStartMs = new Date(2026, 0, 11).getTime()
const periodEndMs = new Date(2026, 0, 17, 23, 59, 59, 999).getTime()
const monthEndShortPeriodStartMs = new Date(2026, 2, 29).getTime()
const monthEndShortPeriodEndMs = new Date(2026, 2, 31, 23, 59, 59, 999).getTime()

const makeExpense = (overrides = {}) => ({
    name: 'Groceries',
    amount: 50,
    date: '2026-01-15',
    category_id: null,
    exclude_from_limit: false,
    ...overrides
})

describe('useWeeklyLimit expense rules', () => {
    it('excludes categorized assigned expenses from weekly tracking and pool', () => {
        const assignedExpense = makeExpense({
            name: 'Rent',
            amount: 400,
            category_id: 'cat-rent'
        })

        expect(isWeeklyTrackedExpense(assignedExpense)).toBe(false)
        expect(shouldReduceWeeklyPool(assignedExpense, periodStartMs, periodEndMs)).toBe(false)
    })

    it('includes uncategorized discretionary expenses in current-period spent only', () => {
        const trackedExpense = makeExpense({
            name: 'Food',
            amount: 60
        })

        expect(isWeeklyTrackedExpense(trackedExpense)).toBe(true)
        expect(shouldReduceWeeklyPool(trackedExpense, periodStartMs, periodEndMs)).toBe(false)
    })

    it('keeps excluded uncategorized expenses out of spent but reduces the pool', () => {
        const excludedExpense = makeExpense({
            name: 'Transfer',
            amount: 30,
            exclude_from_limit: true
        })

        expect(isWeeklyTrackedExpense(excludedExpense)).toBe(false)
        expect(shouldReduceWeeklyPool(excludedExpense, periodStartMs, periodEndMs)).toBe(true)
    })

    it('keeps debt payments out of weekly tracking and pool adjustments', () => {
        const debtPayment = makeExpense({
            name: 'Debt Payment: Visa',
            amount: 120
        })

        expect(isWeeklyTrackedExpense(debtPayment)).toBe(false)
        expect(shouldReduceWeeklyPool(debtPayment, periodStartMs, periodEndMs)).toBe(false)
    })

    it('applies mixed expenses correctly for current-period spent and pool totals', () => {
        const expenses = [
            makeExpense({ name: 'Rent', amount: 300, category_id: 'cat-rent' }),
            makeExpense({ name: 'Groceries', amount: 60, date: '2026-01-12' }),
            makeExpense({ name: 'Subway', amount: 20, date: '2026-01-10' }),
            makeExpense({ name: 'Transfer', amount: 15, exclude_from_limit: true, date: '2026-01-13' }),
            makeExpense({ name: 'Debt Payment: Card', amount: 100, date: '2026-01-14' })
        ]

        const spentThisPeriod = expenses
            .filter((exp) => {
                const expenseDateMs = parseDate(exp.date).getTime()
                return expenseDateMs >= periodStartMs
                    && expenseDateMs <= periodEndMs
                    && isWeeklyTrackedExpense(exp)
            })
            .reduce((sum, exp) => sum + Number(exp.amount), 0)

        const poolAdjustments = expenses
            .filter(exp => shouldReduceWeeklyPool(exp, periodStartMs, periodEndMs))
            .reduce((sum, exp) => sum + Number(exp.amount), 0)

        expect(spentThisPeriod).toBe(60)
        expect(poolAdjustments).toBe(35)
    })

    it('treats a short month-end period as its own spending window', () => {
        const shortPeriodExpense = makeExpense({ amount: 40, date: '2026-03-29' })
        const priorExpense = makeExpense({ amount: 25, date: '2026-03-28' })

        const isInCurrentPeriod =
            parseDate(shortPeriodExpense.date).getTime() >= monthEndShortPeriodStartMs
                && parseDate(shortPeriodExpense.date).getTime() <= monthEndShortPeriodEndMs
                && isWeeklyTrackedExpense(shortPeriodExpense)

        expect(isInCurrentPeriod).toBe(true)
        expect(shouldReduceWeeklyPool(shortPeriodExpense, monthEndShortPeriodStartMs, monthEndShortPeriodEndMs)).toBe(false)
        expect(shouldReduceWeeklyPool(priorExpense, monthEndShortPeriodStartMs, monthEndShortPeriodEndMs)).toBe(true)
    })
})

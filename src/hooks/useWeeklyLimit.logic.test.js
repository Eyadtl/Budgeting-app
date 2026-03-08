import { describe, expect, it } from 'vitest'
import { isWeeklyTrackedExpense, shouldReduceWeeklyPool } from './useWeeklyLimit'
import { parseDate } from '../utils'

const weekStartMs = new Date(2026, 0, 12).getTime()
const todayEndMs = new Date(2026, 0, 15, 23, 59, 59, 999).getTime()

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
        expect(shouldReduceWeeklyPool(assignedExpense, weekStartMs, todayEndMs)).toBe(false)
    })

    it('includes uncategorized discretionary expenses in weekly spent only', () => {
        const weeklyExpense = makeExpense({
            name: 'Food',
            amount: 60
        })

        expect(isWeeklyTrackedExpense(weeklyExpense)).toBe(true)
        expect(shouldReduceWeeklyPool(weeklyExpense, weekStartMs, todayEndMs)).toBe(false)
    })

    it('keeps excluded uncategorized expenses out of spent but reduces weekly pool', () => {
        const excludedExpense = makeExpense({
            name: 'Transfer',
            amount: 30,
            exclude_from_limit: true
        })

        expect(isWeeklyTrackedExpense(excludedExpense)).toBe(false)
        expect(shouldReduceWeeklyPool(excludedExpense, weekStartMs, todayEndMs)).toBe(true)
    })

    it('keeps debt payments out of weekly tracking and pool adjustments', () => {
        const debtPayment = makeExpense({
            name: 'Debt Payment: Visa',
            amount: 120
        })

        expect(isWeeklyTrackedExpense(debtPayment)).toBe(false)
        expect(shouldReduceWeeklyPool(debtPayment, weekStartMs, todayEndMs)).toBe(false)
    })

    it('applies mixed expenses correctly for spent and pool totals', () => {
        const expenses = [
            makeExpense({ name: 'Rent', amount: 300, category_id: 'cat-rent' }),
            makeExpense({ name: 'Groceries', amount: 60 }),
            makeExpense({ name: 'Subway', amount: 20, date: '2026-01-10' }),
            makeExpense({ name: 'Transfer', amount: 15, exclude_from_limit: true }),
            makeExpense({ name: 'Debt Payment: Card', amount: 100 })
        ]

        const spentThisWeek = expenses
            .filter(exp => parseDate(exp.date).getTime() >= weekStartMs && isWeeklyTrackedExpense(exp))
            .reduce((sum, exp) => sum + Number(exp.amount), 0)

        const poolAdjustments = expenses
            .filter(exp => shouldReduceWeeklyPool(exp, weekStartMs, todayEndMs))
            .reduce((sum, exp) => sum + Number(exp.amount), 0)

        expect(spentThisWeek).toBe(60)
        expect(poolAdjustments).toBe(35)
    })

    it('treats Sunday as the start of week for spent and pool boundaries', () => {
        const sundayWeekStartMs = new Date(2026, 0, 11).getTime()
        const sundayExpense = makeExpense({ amount: 40, date: '2026-01-11' })
        const saturdayExpense = makeExpense({ amount: 25, date: '2026-01-10' })

        const sundayIsCurrentWeek =
            parseDate(sundayExpense.date).getTime() >= sundayWeekStartMs
                && isWeeklyTrackedExpense(sundayExpense)

        expect(sundayIsCurrentWeek).toBe(true)
        expect(shouldReduceWeeklyPool(sundayExpense, sundayWeekStartMs, todayEndMs)).toBe(false)
        expect(shouldReduceWeeklyPool(saturdayExpense, sundayWeekStartMs, todayEndMs)).toBe(true)
    })
})

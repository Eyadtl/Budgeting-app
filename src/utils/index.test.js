import { describe, expect, it } from 'vitest'
import {
    formatCurrency,
    parseDate,
    formatDate,
    getCurrentMonth,
    isCurrentMonth,
    filterByMonth,
    getMonthName,
    calculateCategorySpent,
    calculateTotal,
    prepareTransactionsForExport
} from './index'

describe('General Utilities', () => {
    describe('formatCurrency', () => {
        it('formats USD by default', () => {
            expect(formatCurrency(100)).toBe('$100.00')
        })

        it('formats other currencies when specified', () => {
            // Note: Different environments might have different formatting for EUR
            // but usually it contains the € symbol and non-breaking spaces or commas
            const formatted = formatCurrency(100, 'EUR')
            expect(formatted).toContain('€')
        })
    })

    describe('parseDate', () => {
        it('returns the same Date object if passed a Date', () => {
            const now = new Date()
            expect(parseDate(now)).toBe(now)
        })

        it('parses YYYY-MM-DD as a local date', () => {
            const dateStr = '2026-05-20'
            const parsed = parseDate(dateStr)
            expect(parsed.getFullYear()).toBe(2026)
            expect(parsed.getMonth()).toBe(4) // May is 4
            expect(parsed.getDate()).toBe(20)
        })

        it('parses other date strings using default Date constructor', () => {
            const dateStr = '2026-05-20T10:00:00Z'
            const parsed = parseDate(dateStr)
            expect(parsed.getTime()).toBe(new Date(dateStr).getTime())
        })
    })

    describe('formatDate', () => {
        it('formats a date string correctly', () => {
            expect(formatDate('2026-01-15')).toBe('Jan 15, 2026')
        })
    })

    describe('getCurrentMonth', () => {
        it('returns the current month and year', () => {
            const now = new Date()
            const result = getCurrentMonth()
            expect(result.month).toBe(now.getMonth())
            expect(result.year).toBe(now.getFullYear())
        })
    })

    describe('isCurrentMonth', () => {
        it('returns true for a date in the current month', () => {
            const now = new Date()
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
            expect(isCurrentMonth(dateStr)).toBe(true)
        })

        it('returns false for a date in a different month', () => {
            const now = new Date()
            const diffYear = now.getFullYear() - 1
            const dateStr = `${diffYear}-01-01`
            expect(isCurrentMonth(dateStr)).toBe(false)
        })
    })

    describe('filterByMonth', () => {
        it('filters items by month and year', () => {
            const items = [
                { name: 'A', date: '2026-01-10' },
                { name: 'B', date: '2026-01-20' },
                { name: 'C', date: '2026-02-10' },
                { name: 'D', date: '2025-01-10' }
            ]
            const result = filterByMonth(items, 0, 2026)
            expect(result).toHaveLength(2)
            expect(result[0].name).toBe('A')
            expect(result[1].name).toBe('B')
        })
    })

    describe('getMonthName', () => {
        it('returns the correct month name', () => {
            expect(getMonthName(0)).toBe('January')
            expect(getMonthName(11)).toBe('December')
        })
    })

    describe('calculateCategorySpent', () => {
        it('sums expenses for a specific category', () => {
            const expenses = [
                { amount: 10, category_id: 'cat1' },
                { amount: 20, category_id: 'cat1' },
                { amount: 30, category_id: 'cat2' }
            ]
            expect(calculateCategorySpent(expenses, 'cat1')).toBe(30)
        })

        it('returns 0 if no expenses match', () => {
            expect(calculateCategorySpent([], 'cat1')).toBe(0)
        })
    })

    describe('calculateTotal', () => {
        it('sums the amount field of items', () => {
            const items = [
                { amount: 10.5 },
                { amount: '20' },
                { amount: 0 }
            ]
            expect(calculateTotal(items)).toBe(30.5)
        })
    })

    describe('prepareTransactionsForExport', () => {
        it('prepares and sorts income and expense rows', () => {
            const income = [
                { name: 'Salary', amount: 3000, date: '2026-01-01', frequency: 'recurring' }
            ]
            const expenses = [
                { name: 'Groceries', amount: 50, date: '2026-01-05', category_id: 'cat1', is_recurring: false }
            ]
            const categories = [
                { id: 'cat1', name: 'Food' }
            ]

            const result = prepareTransactionsForExport({ income, expenses, categories })

            expect(result).toHaveLength(2)
            // Sorted by date descending, so Groceries (Jan 5) comes first
            expect(result[0].Name).toBe('Groceries')
            expect(result[0].Type).toBe('Expense')
            expect(result[0].Amount).toBe(-50)
            expect(result[0].Category).toBe('Food')

            expect(result[1].Name).toBe('Salary')
            expect(result[1].Type).toBe('Income')
            expect(result[1].Amount).toBe(3000)
        })
    })
})

import { describe, expect, it } from 'vitest'
import { prepareExpensesForExport } from './index'

describe('prepareExpensesForExport', () => {
    it('maps category name from categories list', () => {
        const rows = prepareExpensesForExport({
            expenses: [{
                id: 'exp-1',
                name: 'Groceries',
                amount: 42.5,
                date: '2026-01-10',
                category_id: 'cat-food',
                is_recurring: false
            }],
            categories: [{ id: 'cat-food', name: 'Food' }]
        })

        expect(rows).toEqual([{
            Date: 'Jan 10, 2026',
            Name: 'Groceries',
            Category: 'Food',
            Amount: 42.5,
            Recurring: 'No'
        }])
    })

    it('falls back to nested expense category and then Uncategorized', () => {
        const rows = prepareExpensesForExport({
            expenses: [
                {
                    id: 'exp-1',
                    name: 'Taxi',
                    amount: 18,
                    date: '2026-01-11',
                    category_id: null,
                    categories: { name: 'Transport' },
                    is_recurring: false
                },
                {
                    id: 'exp-2',
                    name: 'Misc',
                    amount: 7,
                    date: '2026-01-10',
                    category_id: null,
                    is_recurring: false
                }
            ],
            categories: []
        })

        expect(rows[0].Category).toBe('Transport')
        expect(rows[1].Category).toBe('Uncategorized')
    })

    it('sorts rows by date descending', () => {
        const rows = prepareExpensesForExport({
            expenses: [
                { id: 'exp-1', name: 'Older', amount: 10, date: '2026-01-01', category_id: null, is_recurring: false },
                { id: 'exp-2', name: 'Newer', amount: 20, date: '2026-01-15', category_id: null, is_recurring: true }
            ],
            categories: []
        })

        expect(rows[0].Name).toBe('Newer')
        expect(rows[1].Name).toBe('Older')
        expect(rows[0].Recurring).toBe('Yes')
    })

    it('returns empty array for empty input', () => {
        const rows = prepareExpensesForExport({ expenses: [], categories: [] })
        expect(rows).toEqual([])
    })
})

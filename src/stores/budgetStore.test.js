import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useBudgetStore } from './budgetStore'
import { supabase } from '../services/supabase/supabase'

// Mock Supabase
vi.mock('../services/supabase/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
        })),
    },
}))

describe('budgetStore', () => {
    beforeEach(() => {
        // Manually reset state because zustand create doesn't provide a reset
        useBudgetStore.setState({
            profile: null,
            incomeSources: [],
            categories: [],
            categoryBudgets: [],
            expenses: [],
            debts: [],
            savingsTransactions: [],
            monthlySavingsRollovers: [],
            weeklyLimitCarryovers: [],
            isLoading: false,
            error: null,
        })
        vi.clearAllMocks()
    })

    describe('fetchProfile', () => {
        it('fetches existing profile', async () => {
            const mockProfile = { id: '1', user_id: 'user1', currency_preference: 'USD' }
            const fromSpy = vi.mocked(supabase.from)
            const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockProfile, error: null })

            fromSpy.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: maybeSingleMock,
            })

            await useBudgetStore.getState().fetchProfile('user1')

            expect(useBudgetStore.getState().profile).toEqual(mockProfile)
            expect(useBudgetStore.getState().isLoading).toBe(false)
        })

        it('creates a new profile if none exists', async () => {
            const fromSpy = vi.mocked(supabase.from)
            const newProfile = { id: 'new', user_id: 'user2', currency_preference: 'USD' }

            // Mock first call (select) returning nothing
            const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
            // Mock second call (insert) returning new profile
            const singleMock = vi.fn().mockResolvedValue({ data: newProfile, error: null })

            fromSpy.mockImplementation((table) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: maybeSingleMock,
                        insert: vi.fn().mockReturnThis(),
                        single: singleMock,
                    }
                }
                return {}
            })

            await useBudgetStore.getState().fetchProfile('user2')

            expect(useBudgetStore.getState().profile).toEqual(newProfile)
        })
    })

    describe('addIncomeSource', () => {
        it('adds a new income source and updates state', async () => {
            const newIncome = { id: 'inc1', name: 'Job', amount: 1000 }
            const fromSpy = vi.mocked(supabase.from)
            const singleMock = vi.fn().mockResolvedValue({ data: newIncome, error: null })

            fromSpy.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: singleMock,
            })

            const result = await useBudgetStore.getState().addIncomeSource({ name: 'Job', amount: 1000 })

            expect(result.success).toBe(true)
            expect(useBudgetStore.getState().incomeSources).toContainEqual(newIncome)
        })

        it('handles error when adding income source', async () => {
            const fromSpy = vi.mocked(supabase.from)
            const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed to insert' } })

            fromSpy.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: singleMock,
            })

            const result = await useBudgetStore.getState().addIncomeSource({ name: 'Job', amount: 1000 })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Failed to insert')
        })
    })

    describe('addCategory', () => {
        it('adds a new category and updates state', async () => {
            const newCategory = { id: 'cat1', name: 'Food', budget_limit: 500 }
            const fromSpy = vi.mocked(supabase.from)
            const singleMock = vi.fn().mockResolvedValue({ data: newCategory, error: null })

            fromSpy.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: singleMock,
            })

            const result = await useBudgetStore.getState().addCategory({ name: 'Food', budget_limit: 500 })

            expect(result.success).toBe(true)
            expect(useBudgetStore.getState().categories).toContainEqual(newCategory)
        })
    })
})

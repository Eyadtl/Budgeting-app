import { describe, expect, it } from 'vitest'
import {
    buildCurrentMonthWeeklyCarryover,
    calculateFinalWeekOverrunForMonth,
    calculateRemainingCarryoverAmount,
    calculateEffectiveMonthlyIncome,
    getCarryoverDeductionForMonth
} from './weeklyCarryover'

describe('weekly carryover utilities', () => {
    it('calculates final-week overrun using month-end weekly limit', () => {
        const result = calculateFinalWeekOverrunForMonth({
            incomeSources: [{ amount: 1000, date: '2026-01-03' }],
            expenses: [
                { amount: 100, date: '2026-01-05', name: 'Earlier Expense', category_id: null },
                { amount: 950, date: '2026-01-29', name: 'Final Week Expense', category_id: null }
            ],
            categories: [],
            categoryBudgets: [],
            month: 0,
            year: 2026,
            carryoverDeduction: 0
        })

        expect(result.weeklyLimit).toBe(900)
        expect(result.spentThisWeek).toBe(950)
        expect(result.overrun).toBe(50)
    })

    it('treats a short month-end period as the final carryover window', () => {
        const result = calculateFinalWeekOverrunForMonth({
            incomeSources: [{ amount: 700, date: '2026-03-01' }],
            expenses: [
                { amount: 140, date: '2026-03-10', name: 'Earlier Expense', category_id: null },
                { amount: 300, date: '2026-03-30', name: 'Final Period Expense', category_id: null }
            ],
            categories: [],
            categoryBudgets: [],
            month: 2,
            year: 2026,
            carryoverDeduction: 0
        })

        expect(result.periodStart).toEqual(new Date(2026, 2, 29))
        expect(result.periodEnd).toEqual(new Date(2026, 2, 31))
        expect(result.weeklyLimit).toBe(240)
        expect(result.spentThisWeek).toBe(300)
        expect(result.overrun).toBe(60)
    })

    it('builds current-month carryover from unresolved prior debt + source month final-week overrun', () => {
        const payload = buildCurrentMonthWeeklyCarryover({
            userId: 'user-1',
            incomeSources: [{ amount: 70, date: '2026-02-06' }],
            expenses: [{ amount: 30, date: '2026-02-24', name: 'Snacks', category_id: null }],
            categories: [],
            categoryBudgets: [],
            weeklyLimitCarryovers: [
                {
                    user_id: 'user-1',
                    rollover_month: '2026-02-01',
                    source_month: '2026-01-01',
                    carryover_amount: 120
                }
            ],
            referenceDate: new Date(2026, 2, 10) // March 10, 2026
        })

        expect(payload.rolloverMonth).toBe('2026-03-01')
        expect(payload.sourceMonth).toBe('2026-02-01')
        expect(payload.sourceRemainingAmount).toBe(50)
        expect(payload.sourceFinalWeekOverrun).toBe(30)
        expect(payload.currentCarryoverAmount).toBe(80)
        expect(payload.previousMonthUpdate).toMatchObject({
            user_id: 'user-1',
            rollover_month: '2026-02-01',
            remaining_amount: 50,
            status: 'applied'
        })
        expect(payload.currentMonthRow).toMatchObject({
            user_id: 'user-1',
            rollover_month: '2026-03-01',
            source_month: '2026-02-01',
            carryover_amount: 80,
            remaining_amount: 80,
            status: 'pending'
        })
    })

    it('returns no current-month row when no overrun debt exists', () => {
        const payload = buildCurrentMonthWeeklyCarryover({
            userId: 'user-1',
            incomeSources: [],
            expenses: [],
            categories: [],
            categoryBudgets: [],
            weeklyLimitCarryovers: [],
            referenceDate: new Date(2026, 3, 10) // April 10, 2026
        })

        expect(payload.currentCarryoverAmount).toBe(0)
        expect(payload.currentMonthRow).toBeNull()
        expect(payload.previousMonthUpdate).toBeNull()
    })

    it('computes effective income and remaining carryover amounts', () => {
        expect(calculateEffectiveMonthlyIncome(250, 90)).toBe(160)
        expect(calculateEffectiveMonthlyIncome(80, 90)).toBe(0)
        expect(calculateRemainingCarryoverAmount(200, 50)).toBe(150)
        expect(calculateRemainingCarryoverAmount(200, 260)).toBe(0)
    })

    it('reads carryover deduction by rollover month', () => {
        const rows = [
            { rollover_month: '2026-03-01', carryover_amount: 45.25 },
            { rollover_month: '2026-02-01', carryover_amount: 15 }
        ]

        expect(getCarryoverDeductionForMonth(rows, '2026-03-01')).toBe(45.25)
        expect(getCarryoverDeductionForMonth(rows, '2026-04-01')).toBe(0)
    })
})

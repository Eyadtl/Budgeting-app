import { describe, expect, it } from 'vitest'
import {
    buildCurrentMonthSavingsRolloverPrompt,
    calculateMonthCashSurplus,
    calculateSavingsBalance,
    calculateSetSavingsBalanceDelta
} from './savings'

describe('savings utilities', () => {
    it('calculates savings balance from signed transactions', () => {
        const balance = calculateSavingsBalance([
            { signed_amount: 100 },
            { signed_amount: -25.5 },
            { signed_amount: 40 }
        ])

        expect(balance).toBe(114.5)
    })

    it('calculates month cash surplus and caps suggestion at zero', () => {
        const positive = calculateMonthCashSurplus({
            incomeSources: [
                { amount: 1000, date: '2026-01-05' },
                { amount: 200, date: '2026-01-20' },
                { amount: 999, date: '2026-02-01' }
            ],
            expenses: [
                { amount: 150, date: '2026-01-07' },
                { amount: 100, date: '2026-01-10' }
            ],
            month: 0,
            year: 2026
        })

        expect(positive.incomeTotal).toBe(1200)
        expect(positive.expenseTotal).toBe(250)
        expect(positive.rawSurplus).toBe(950)
        expect(positive.suggestedAmount).toBe(950)

        const negative = calculateMonthCashSurplus({
            incomeSources: [{ amount: 100, date: '2026-01-02' }],
            expenses: [{ amount: 150, date: '2026-01-03' }],
            month: 0,
            year: 2026
        })

        expect(negative.rawSurplus).toBe(-50)
        expect(negative.suggestedAmount).toBe(0)
    })

    it('builds a current-month rollover prompt from previous month surplus', () => {
        const prompt = buildCurrentMonthSavingsRolloverPrompt({
            incomeSources: [{ amount: 1000, date: '2026-01-05' }],
            expenses: [{ amount: 300, date: '2026-01-06' }],
            monthlySavingsRollovers: [],
            referenceDate: new Date(2026, 1, 3) // Feb 3, 2026
        })

        expect(prompt).toMatchObject({
            rolloverMonth: '2026-02-01',
            sourceMonth: '2026-01-01',
            suggestedAmount: 700,
            incomeTotal: 1000,
            expenseTotal: 300
        })
    })

    it('does not build prompt when rollover month already accepted or skipped', () => {
        const baseArgs = {
            incomeSources: [{ amount: 1000, date: '2026-01-05' }],
            expenses: [{ amount: 300, date: '2026-01-06' }],
            referenceDate: new Date(2026, 1, 3)
        }

        const accepted = buildCurrentMonthSavingsRolloverPrompt({
            ...baseArgs,
            monthlySavingsRollovers: [{ rollover_month: '2026-02-01', status: 'accepted' }]
        })
        const skipped = buildCurrentMonthSavingsRolloverPrompt({
            ...baseArgs,
            monthlySavingsRollovers: [{ rollover_month: '2026-02-01', status: 'skipped' }]
        })

        expect(accepted).toBeNull()
        expect(skipped).toBeNull()
    })

    it('calculates set-balance adjustment delta', () => {
        expect(calculateSetSavingsBalanceDelta(120, 200)).toBe(80)
        expect(calculateSetSavingsBalanceDelta(200, 120)).toBe(-80)
        expect(calculateSetSavingsBalanceDelta(50, 50)).toBe(0)
    })
})


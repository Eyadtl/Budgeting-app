import { describe, expect, it } from 'vitest'
import {
    calculateProRatedWeeklyLimit,
    calculateWeeklyLimit,
    getBudgetPeriodsForMonthParts,
    getCurrentBudgetPeriod,
    getRemainingBudgetPeriodsInMonth,
    getStartOfWeek,
    getWeeksRemainingInCurrentMonth
} from './weeklyLimit'

describe('weeklyLimit utilities', () => {
    it('keeps the legacy Sunday week-start helper intact', () => {
        const sundayAfternoon = new Date(2026, 0, 11, 15, 30, 45, 123)
        const mondayMorning = new Date(2026, 0, 12, 9, 0, 0, 0)
        const saturdayNight = new Date(2026, 0, 17, 23, 59, 59, 999)

        expect(getStartOfWeek(sundayAfternoon).getTime()).toBe(new Date(2026, 0, 11).getTime())
        expect(getStartOfWeek(mondayMorning).getTime()).toBe(new Date(2026, 0, 11).getTime())
        expect(getStartOfWeek(saturdayNight).getTime()).toBe(new Date(2026, 0, 11).getTime())
    })

    it('builds month-bounded periods when a month starts mid-week', () => {
        const periods = getBudgetPeriodsForMonthParts(2026, 3) // April 2026

        expect(periods).toHaveLength(5)
        expect(periods[0]).toMatchObject({
            start: new Date(2026, 3, 1),
            end: new Date(2026, 3, 4),
            totalDays: 4
        })
        expect(periods[1]).toMatchObject({
            start: new Date(2026, 3, 5),
            end: new Date(2026, 3, 11),
            totalDays: 7
        })
        expect(periods[4]).toMatchObject({
            start: new Date(2026, 3, 26),
            end: new Date(2026, 3, 30),
            totalDays: 5
        })
    })

    it('returns the current month-bounded period and actual days remaining', () => {
        const period = getCurrentBudgetPeriod(new Date(2026, 2, 29)) // March 29, 2026

        expect(period).toMatchObject({
            start: new Date(2026, 2, 29),
            end: new Date(2026, 2, 31),
            totalDays: 3,
            daysRemaining: 3
        })
    })

    it('resets on month start and then tracks the next Sunday period', () => {
        const monthStartPeriod = getCurrentBudgetPeriod(new Date(2026, 3, 1)) // April 1, 2026
        const sundayPeriod = getCurrentBudgetPeriod(new Date(2026, 3, 5)) // April 5, 2026

        expect(monthStartPeriod).toMatchObject({
            start: new Date(2026, 3, 1),
            end: new Date(2026, 3, 4),
            totalDays: 4
        })
        expect(sundayPeriod).toMatchObject({
            start: new Date(2026, 3, 5),
            end: new Date(2026, 3, 11),
            totalDays: 7
        })
    })

    it('counts remaining budget periods in the month', () => {
        expect(getWeeksRemainingInCurrentMonth(new Date(2026, 3, 1))).toBe(5)
        expect(getWeeksRemainingInCurrentMonth(new Date(2026, 3, 5))).toBe(4)
        expect(getWeeksRemainingInCurrentMonth(new Date(2026, 2, 29))).toBe(1)
    })

    it('uses actual period length when calculating the current limit', () => {
        const marchTailLimit = calculateWeeklyLimit(120, 0, new Date(2026, 2, 29))
        const aprilStartLimit = calculateWeeklyLimit(700, 0, new Date(2026, 3, 1))
        const aprilFirstSundayLimit = calculateWeeklyLimit(700, 0, new Date(2026, 3, 5))

        expect(marchTailLimit).toBeCloseTo(120 * (3 / 7), 5)
        expect(aprilStartLimit).toBeCloseTo((700 / 5) * (4 / 7), 5)
        expect(aprilFirstSundayLimit).toBeCloseTo(700 / 4, 5)
    })

    it('pro-rates remaining days inside the current bounded period', () => {
        const fullPeriodLimit = 140

        expect(calculateProRatedWeeklyLimit(fullPeriodLimit, new Date(2026, 3, 1))).toBe(140)
        expect(calculateProRatedWeeklyLimit(fullPeriodLimit, new Date(2026, 3, 3))).toBe(70)
        expect(calculateProRatedWeeklyLimit(fullPeriodLimit, new Date(2026, 2, 31))).toBeCloseTo(140 / 3, 5)
    })

    it('returns the remaining month-bounded periods from the active period onward', () => {
        const periods = getRemainingBudgetPeriodsInMonth(new Date(2026, 3, 5))

        expect(periods).toHaveLength(4)
        expect(periods[0]).toMatchObject({
            start: new Date(2026, 3, 5),
            end: new Date(2026, 3, 11),
            totalDays: 7
        })
    })
})

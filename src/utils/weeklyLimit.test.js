import { describe, expect, it } from 'vitest'
import {
    calculateProRatedWeeklyLimit,
    getDaysRemainingInWeek,
    getStartOfWeek,
    getWeeksRemainingInCurrentMonth
} from './weeklyLimit'

describe('weeklyLimit utilities', () => {
    it('returns Sunday midnight as start of week', () => {
        const sundayAfternoon = new Date(2026, 0, 11, 15, 30, 45, 123)
        const mondayMorning = new Date(2026, 0, 12, 9, 0, 0, 0)
        const saturdayNight = new Date(2026, 0, 17, 23, 59, 59, 999)

        expect(getStartOfWeek(sundayAfternoon).getTime()).toBe(new Date(2026, 0, 11).getTime())
        expect(getStartOfWeek(mondayMorning).getTime()).toBe(new Date(2026, 0, 11).getTime())
        expect(getStartOfWeek(saturdayNight).getTime()).toBe(new Date(2026, 0, 11).getTime())
    })

    it('calculates days remaining for a Sun-Sat week', () => {
        expect(getDaysRemainingInWeek(new Date(2026, 0, 11))).toBe(7) // Sunday
        expect(getDaysRemainingInWeek(new Date(2026, 0, 12))).toBe(6) // Monday
        expect(getDaysRemainingInWeek(new Date(2026, 0, 17))).toBe(1) // Saturday
    })

    it('keeps weeks-remaining stable during the same Sun-Sat week', () => {
        expect(getWeeksRemainingInCurrentMonth(new Date(2026, 0, 4))).toBe(4) // Sunday
        expect(getWeeksRemainingInCurrentMonth(new Date(2026, 0, 5))).toBe(4) // Monday
        expect(getWeeksRemainingInCurrentMonth(new Date(2026, 0, 31))).toBe(1) // Saturday
    })

    it('clamps effective start to month start when week begins in prior month', () => {
        const juneFirst = new Date(2026, 5, 1)
        const weekStart = getStartOfWeek(juneFirst)

        expect(weekStart.getMonth()).toBe(4) // May
        expect(getWeeksRemainingInCurrentMonth(juneFirst)).toBe(5)
    })

    it('pro-rates weekly limits by remaining Sun-Sat days', () => {
        expect(calculateProRatedWeeklyLimit(700, new Date(2026, 0, 11))).toBe(700) // Sunday
        expect(calculateProRatedWeeklyLimit(700, new Date(2026, 0, 17))).toBe(100) // Saturday
    })
})

import { useMemo, useState } from 'react'
import { DollarSign, Trash2 } from 'lucide-react'
import { Button, Input, Select } from '../ui'
import { formatCurrency } from '../../utils'

const modeOptions = [
    { value: 'add', label: 'Add to remaining' },
    { value: 'remove', label: 'Remove from remaining' },
    { value: 'set', label: 'Set remaining to' },
]

function toNumber(value, fallback = 0) {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

/**
 * Adjust a category's "remaining" amount by updating its budget_limit.
 * remaining = budget_limit - spent
 */
export function CategoryRemainingForm({
    category,
    spent: spentProp,
    currencyPreference = 'USD',
    onSubmit,
    onCancel,
    isLoading = false
}) {
    const spent = useMemo(() => toNumber(spentProp ?? category?.spent, 0), [spentProp, category?.spent])
    const carryover = useMemo(() => toNumber(category?.carryover, 0), [category?.carryover])
    const budgeted = useMemo(() => toNumber(category?.budgeted ?? category?.budget_limit, 0), [category?.budgeted, category?.budget_limit])
    const remaining = useMemo(() => carryover + budgeted - spent, [carryover, budgeted, spent])

    const [mode, setMode] = useState('add')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState(null)

    const parsedAmount = useMemo(() => {
        if (amount === '') return NaN
        return Number(amount)
    }, [amount])

    const preview = useMemo(() => {
        const amt = Number.isFinite(parsedAmount) ? parsedAmount : 0

        let nextBudgeted = budgeted
        if (mode === 'add') nextBudgeted = budgeted + amt
        if (mode === 'remove') nextBudgeted = budgeted - amt
        if (mode === 'set') nextBudgeted = spent + amt - carryover

        return {
            budgeted: nextBudgeted,
            available: carryover + nextBudgeted,
            remaining: carryover + nextBudgeted - spent
        }
    }, [mode, parsedAmount, budgeted, carryover, spent])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (!category?.id) {
            setError('Missing category.')
            return
        }

        if (!Number.isFinite(parsedAmount)) {
            setError('Enter a valid amount.')
            return
        }

        if (parsedAmount < 0) {
            setError('Amount must be 0 or more.')
            return
        }

        if ((mode === 'add' || mode === 'remove') && parsedAmount === 0) {
            setError('Amount must be greater than 0.')
            return
        }

        if (mode === 'remove' && (remaining <= 0 || parsedAmount > remaining)) {
            setError('You cannot remove more than the remaining amount.')
            return
        }

        await onSubmit({
            amount: preview.budgeted
        })
    }

    const handleClearRemaining = () => {
        setMode('set')
        setAmount('0')
        setError(null)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Spent</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(spent, currencyPreference)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-600 dark:text-slate-400">Budgeted (this month)</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(budgeted, currencyPreference)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-600 dark:text-slate-400">Carryover</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(carryover, currencyPreference)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-600 dark:text-slate-400">Remaining</span>
                    <span className={`font-semibold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(remaining, currencyPreference)}
                    </span>
                </div>
            </div>

            <Select
                label="Action"
                value={mode}
                onChange={(e) => {
                    setMode(e.target.value)
                    setError(null)
                }}
                options={modeOptions}
                placeholder={null}
            />

            <div className="relative">
                <Input
                    label={mode === 'set' ? 'New remaining amount' : 'Amount'}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                        setAmount(e.target.value)
                        setError(null)
                    }}
                    required
                />
                <DollarSign className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">New budgeted</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(preview.budgeted, currencyPreference)}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-600 dark:text-slate-400">New available</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(preview.available, currencyPreference)}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-600 dark:text-slate-400">New remaining</span>
                    <span className={`font-semibold ${preview.remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(preview.remaining, currencyPreference)}
                    </span>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="danger"
                    onClick={handleClearRemaining}
                    className="flex-1"
                    disabled={remaining === 0}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Remaining
                </Button>
            </div>

            <Button
                type="submit"
                loading={isLoading}
                className="w-full"
            >
                Update Remaining
            </Button>
        </form>
    )
}

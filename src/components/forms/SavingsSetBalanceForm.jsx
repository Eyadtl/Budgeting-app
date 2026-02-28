import { useMemo, useState } from 'react'
import { Button, Input } from '../ui'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '../../utils'

/**
 * Form for setting the total savings balance (creates an adjustment transaction)
 */
export function SavingsSetBalanceForm({
    currentBalance = 0,
    onSubmit,
    onCancel,
    isLoading = false,
    currencyPreference = 'USD'
}) {
    const [formData, setFormData] = useState({
        targetBalance: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    })
    const [error, setError] = useState('')

    const parsedTarget = useMemo(() => {
        if (formData.targetBalance === '') return Number.NaN
        return Number(formData.targetBalance)
    }, [formData.targetBalance])
    const delta = useMemo(() => {
        if (!Number.isFinite(parsedTarget)) return null
        return parsedTarget - Number(currentBalance || 0)
    }, [parsedTarget, currentBalance])

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }))
        if (error) setError('')
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const targetBalance = Number(formData.targetBalance)
        if (!Number.isFinite(targetBalance) || targetBalance < 0) {
            setError('Savings balance must be 0 or greater.')
            return
        }

        if (targetBalance === Number(currentBalance || 0)) {
            setError('Savings balance is already at that amount.')
            return
        }

        onSubmit({
            targetBalance,
            date: formData.date,
            note: formData.note.trim()
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Savings Balance</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(currentBalance, currencyPreference)}
                </p>
            </div>

            <div className="relative">
                <Input
                    label="New Savings Balance"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.targetBalance}
                    onChange={handleChange('targetBalance')}
                    error={error}
                    required
                />
                <DollarSign className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
            </div>

            <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleChange('date')}
                required
            />

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Note (optional)
                </label>
                <textarea
                    rows={3}
                    value={formData.note}
                    onChange={handleChange('note')}
                    placeholder="e.g., Bank corrected balance"
                    className="
                        w-full px-4 py-2 rounded-lg border
                        bg-white dark:bg-slate-800
                        text-slate-900 dark:text-slate-100
                        border-slate-300 dark:border-slate-600
                        placeholder-slate-400 dark:placeholder-slate-500
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        transition-all duration-200
                    "
                />
            </div>

            {Number.isFinite(delta) && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-sm">
                    <p className="text-slate-500 dark:text-slate-400">Adjustment preview</p>
                    <p className={delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {delta >= 0 ? '+' : ''}{formatCurrency(delta, currencyPreference)}
                    </p>
                </div>
            )}

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
                    type="submit"
                    loading={isLoading}
                    className="flex-1"
                >
                    Set Balance
                </Button>
            </div>
        </form>
    )
}

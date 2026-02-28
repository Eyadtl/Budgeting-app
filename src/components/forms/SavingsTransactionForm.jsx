import { useMemo, useState } from 'react'
import { Button, Input } from '../ui'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '../../utils'

/**
 * Form for savings deposits and withdrawals
 */
export function SavingsTransactionForm({
    mode = 'deposit',
    onSubmit,
    onCancel,
    isLoading = false,
    currencyPreference = 'USD',
    maxAmount = null
}) {
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    })
    const [error, setError] = useState('')

    const isWithdraw = mode === 'withdraw'
    const title = isWithdraw ? 'Withdraw from Savings' : 'Deposit to Savings'
    const actionText = isWithdraw ? 'Withdraw' : 'Deposit'

    const parsedAmount = useMemo(() => Number(formData.amount), [formData.amount])

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }))
        if (error) setError('')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const amount = Number(formData.amount)
        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Amount must be greater than 0.')
            return
        }

        if (isWithdraw && Number.isFinite(maxAmount) && amount > maxAmount) {
            setError('You cannot withdraw more than your current savings balance.')
            return
        }

        onSubmit({
            amount,
            date: formData.date,
            note: formData.note.trim()
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                {isWithdraw && Number.isFinite(maxAmount) && (
                    <p className="text-sm mt-1 text-slate-700 dark:text-slate-200">
                        Available: {formatCurrency(maxAmount, currencyPreference)}
                    </p>
                )}
            </div>

            <div className="relative">
                <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={isWithdraw && Number.isFinite(maxAmount) ? maxAmount : undefined}
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange('amount')}
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
                    placeholder={isWithdraw ? 'e.g., Emergency expense' : 'e.g., Extra paycheck leftover'}
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

            {Number.isFinite(parsedAmount) && parsedAmount > 0 && (
                <p className={`text-sm ${isWithdraw ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {isWithdraw ? '-' : '+'}{formatCurrency(parsedAmount, currencyPreference)}
                </p>
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
                    {actionText}
                </Button>
            </div>
        </form>
    )
}


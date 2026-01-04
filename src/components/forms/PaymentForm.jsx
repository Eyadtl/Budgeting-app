import { useState } from 'react'
import { Button, Input } from '../ui'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '../../utils'

/**
 * Form for recording a debt payment
 */
export function PaymentForm({
    debt,
    onSubmit,
    onCancel,
    currencyPreference = 'USD',
    isLoading = false
}) {
    const [amount, setAmount] = useState('')
    const remaining = debt.total_balance - debt.amount_paid

    const handleSubmit = (e) => {
        e.preventDefault()
        const paymentAmount = parseFloat(amount) || 0
        onSubmit(paymentAmount)
    }

    const handlePayFull = () => {
        setAmount(remaining.toString())
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Debt Info */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Recording payment for</p>
                <p className="font-semibold text-slate-900 dark:text-white text-lg">{debt.name}</p>
                <div className="flex justify-between mt-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Remaining balance:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(remaining, currencyPreference)}
                    </span>
                </div>
            </div>

            <div className="relative">
                <Input
                    label="Payment Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={remaining}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
                <DollarSign className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
            </div>

            <button
                type="button"
                onClick={handlePayFull}
                className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
                Pay remaining balance ({formatCurrency(remaining, currencyPreference)})
            </button>

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
                    Record Payment
                </Button>
            </div>
        </form>
    )
}

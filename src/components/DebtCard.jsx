import { Trash2, DollarSign, Percent, Edit3 } from 'lucide-react'
import { ProgressBar } from './ui/ProgressBar'
import { formatCurrency } from '../utils'

/**
 * Debt card showing name, balance, paid amount, interest rate, and progress
 */
export function DebtCard({
    debt,
    currencyPreference = 'USD',
    onRecordPayment,
    onEdit,
    onDelete
}) {
    const { name, total_balance, amount_paid, interest_rate } = debt
    const remaining = total_balance - amount_paid
    const percentage = Math.round((amount_paid / Math.max(total_balance, 1)) * 100)
    const isPaidOff = remaining <= 0

    return (
        <div className={`
            bg-white dark:bg-slate-800 rounded-xl border 
            ${isPaidOff ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700'}
            p-4 shadow-sm
        `}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                        {name}
                    </h3>
                    {interest_rate > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <Percent className="w-3 h-3" />
                            <span>{interest_rate}% APR</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(debt)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(debt.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Progress */}
            <ProgressBar
                value={amount_paid}
                max={total_balance}
                color={isPaidOff ? '#22c55e' : '#6366f1'}
                showLabel={false}
                size="md"
                className="mb-3"
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(total_balance, currencyPreference)}
                    </p>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Paid</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(amount_paid, currencyPreference)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
                    <p className={`font-medium ${isPaidOff ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {isPaidOff ? 'Paid off!' : formatCurrency(remaining, currencyPreference)}
                    </p>
                </div>
            </div>

            {/* Record Payment Button */}
            {onRecordPayment && !isPaidOff && (
                <button
                    onClick={() => onRecordPayment(debt)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    <DollarSign className="w-4 h-4" />
                    Record Payment
                </button>
            )}

            {isPaidOff && (
                <div className="text-center py-2 text-green-600 dark:text-green-400 font-medium text-sm">
                    ✓ Congratulations! This debt is paid off!
                </div>
            )}
        </div>
    )
}

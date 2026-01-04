import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { formatCurrency } from '../utils'

export function HeaderStats({ totalIncome = 0, totalAssigned = 0, currencyPreference = 'USD' }) {
    const remaining = totalIncome - totalAssigned
    const isOverBudget = remaining < 0
    const isBalanced = remaining === 0 && totalIncome > 0

    return (
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold opacity-90">Monthly Budget</h2>
                <Wallet className="w-6 h-6 opacity-80" />
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Total Income */}
                <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="w-4 h-4 mr-1 opacity-80" />
                        <span className="text-xs opacity-80 uppercase tracking-wider">Income</span>
                    </div>
                    <p className="text-xl font-bold">
                        {formatCurrency(totalIncome, currencyPreference)}
                    </p>
                </div>

                {/* Total Assigned */}
                <div className="text-center border-x border-white/20">
                    <div className="flex items-center justify-center mb-1">
                        <TrendingDown className="w-4 h-4 mr-1 opacity-80" />
                        <span className="text-xs opacity-80 uppercase tracking-wider">Assigned</span>
                    </div>
                    <p className="text-xl font-bold">
                        {formatCurrency(totalAssigned, currencyPreference)}
                    </p>
                </div>

                {/* Remaining */}
                <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                        <span className="text-xs opacity-80 uppercase tracking-wider">
                            {isBalanced ? '✓ Balanced' : 'Remaining'}
                        </span>
                    </div>
                    <p className={`text-xl font-bold ${isOverBudget
                            ? 'text-red-300'
                            : isBalanced
                                ? 'text-green-300'
                                : 'text-white'
                        }`}>
                        {formatCurrency(Math.abs(remaining), currencyPreference)}
                        {isOverBudget && ' over'}
                    </p>
                </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-4">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isOverBudget
                                ? 'bg-red-400'
                                : isBalanced
                                    ? 'bg-green-400'
                                    : 'bg-white'
                            }`}
                        style={{
                            width: `${Math.min((totalAssigned / Math.max(totalIncome, 1)) * 100, 100)}%`
                        }}
                    />
                </div>
                <p className="text-xs text-center mt-2 opacity-70">
                    {totalIncome > 0
                        ? `${Math.round((totalAssigned / totalIncome) * 100)}% of income assigned`
                        : 'Add income to start budgeting'
                    }
                </p>
            </div>
        </div>
    )
}

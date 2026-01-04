import { Trash2, Edit3 } from 'lucide-react'
import { ProgressBar } from './ui/ProgressBar'
import { formatCurrency } from '../utils'

/**
 * Category card showing name, budget limit, spent amount, and progress
 */
export function CategoryCard({
    category,
    spent = 0,
    currencyPreference = 'USD',
    onEdit,
    onDelete
}) {
    const { name, budget_limit, color_code } = category
    const percentage = Math.round((spent / Math.max(budget_limit, 1)) * 100)
    const remaining = budget_limit - spent
    const isOverBudget = spent > budget_limit

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color_code || '#6366f1' }}
                    />
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {name}
                    </h3>
                </div>
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(category)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(category.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Progress */}
            <ProgressBar
                value={spent}
                max={budget_limit}
                color={color_code || '#6366f1'}
                showLabel={false}
                size="md"
                className="mb-3"
            />

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {formatCurrency(spent, currencyPreference)} / {formatCurrency(budget_limit, currencyPreference)}
                </span>
                <span className={`${isOverBudget
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : remaining > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-500'
                    }`}>
                    {isOverBudget
                        ? `${formatCurrency(Math.abs(remaining), currencyPreference)} over`
                        : `${formatCurrency(remaining, currencyPreference)} left`
                    }
                </span>
            </div>
        </div>
    )
}

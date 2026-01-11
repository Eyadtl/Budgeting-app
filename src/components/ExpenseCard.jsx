import { Trash2, Repeat, EyeOff } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils'

/**
 * Expense card for individual expense entry
 */
export function ExpenseCard({
    expense,
    currencyPreference = 'USD',
    onDelete
}) {
    const { name, amount, date, is_recurring, exclude_from_limit, categories } = expense
    const categoryName = categories?.name || 'Uncategorized'
    const categoryColor = categories?.color_code || '#94a3b8'

    return (
        <div className="flex items-center gap-4 py-3 px-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow">
            {/* Category indicator */}
            <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryColor }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                        {name}
                    </h4>
                    {is_recurring && (
                        <Repeat className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" title="Recurring Expense" />
                    )}
                    {exclude_from_limit && (
                        <EyeOff className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" title="Excluded from Weekly Limit" />
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{categoryName}</span>
                    <span>•</span>
                    <span>{formatDate(date)}</span>
                </div>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
                <p className="font-semibold text-slate-900 dark:text-white">
                    -{formatCurrency(amount, currencyPreference)}
                </p>
            </div>

            {/* Delete button */}
            {onDelete && (
                <button
                    onClick={() => onDelete(expense.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

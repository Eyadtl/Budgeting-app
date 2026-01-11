import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

const STATUS_STYLES = {
    safe: {
        bar: 'bg-green-500',
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        Icon: TrendingDown
    },
    warning: {
        bar: 'bg-amber-500',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        Icon: AlertTriangle
    },
    exceeded: {
        bar: 'bg-red-500',
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        Icon: TrendingUp
    }
}

/**
 * Weekly spending limit progress bar component
 * Shows spending progress with color-coded status
 */
export function WeeklyLimitBar({
    spent,
    limit,
    percentageUsed,
    status,
    daysRemaining,
    currencyPreference = 'USD'
}) {
    const styles = STATUS_STYLES[status] || STATUS_STYLES.safe
    const { Icon } = styles

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyPreference,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className={`p-3 rounded-xl ${styles.bg} mt-4`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${styles.text}`} />
                    <span className={`text-sm font-medium ${styles.text}`}>
                        Weekly Limit
                    </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${styles.bar} transition-all duration-300`}
                    style={{ width: `${Math.min(100, percentageUsed)}%` }}
                />
            </div>

            {/* Values */}
            <div className="flex justify-between text-xs">
                <span className={styles.text}>
                    {formatCurrency(spent)} spent
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                    {formatCurrency(limit)} limit
                </span>
            </div>
        </div>
    )
}

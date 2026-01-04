/**
 * Progress bar component with color support
 */
export function ProgressBar({
    value = 0,
    max = 100,
    color = '#6366f1',
    showLabel = true,
    size = 'md',
    className = ''
}) {
    const percentage = Math.min(Math.round((value / Math.max(max, 1)) * 100), 100)
    const isOverBudget = value > max

    const sizes = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4'
    }

    const barColor = isOverBudget ? '#ef4444' : color

    return (
        <div className={className}>
            <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${sizes[size]}`}>
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${isOverBudget ? 100 : percentage}%`,
                        backgroundColor: barColor
                    }}
                />
            </div>
            {showLabel && (
                <div className="flex justify-between mt-1">
                    <span className={`text-xs ${isOverBudget ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isOverBudget ? `${percentage}% - Over budget!` : `${percentage}%`}
                    </span>
                </div>
            )}
        </div>
    )
}

/**
 * Card component for content containers
 */
export function Card({ children, className = '', ...props }) {
    return (
        <div
            className={`
        bg-white dark:bg-slate-800
        rounded-xl shadow-sm
        border border-slate-200 dark:border-slate-700
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className = '', ...props }) {
    return (
        <div
            className={`
        px-6 py-4
        border-b border-slate-200 dark:border-slate-700
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardContent({ children, className = '', ...props }) {
    return (
        <div className={`px-6 py-4 ${className}`} {...props}>
            {children}
        </div>
    )
}

export function CardFooter({ children, className = '', ...props }) {
    return (
        <div
            className={`
        px-6 py-4
        border-t border-slate-200 dark:border-slate-700
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    )
}

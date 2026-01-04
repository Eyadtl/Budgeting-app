/**
 * Input component with label and error support
 */
export function Input({
    label,
    error,
    type = 'text',
    className = '',
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`
          w-full px-4 py-2 rounded-lg border
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-100
          border-slate-300 dark:border-slate-600
          placeholder-slate-400 dark:placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          disabled:bg-slate-100 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    )
}

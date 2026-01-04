import { ChevronDown } from 'lucide-react'

/**
 * Styled select dropdown component
 */
export function Select({
    label,
    options = [],
    value,
    onChange,
    placeholder = 'Select an option',
    error,
    disabled = false,
    className = '',
    ...props
}) {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`
                        w-full px-4 py-2 pr-10 rounded-lg border appearance-none
                        bg-white dark:bg-slate-800
                        text-slate-900 dark:text-slate-100
                        border-slate-300 dark:border-slate-600
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        disabled:bg-slate-100 disabled:cursor-not-allowed
                        transition-all duration-200
                        ${error ? 'border-red-500 focus:ring-red-500' : ''}
                    `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    )
}

import { useState } from 'react'
import { Button, Input, Select } from '../ui'
import { DollarSign } from 'lucide-react'

/**
 * Form for adding/editing expenses
 */
export function ExpenseForm({
    onSubmit,
    onCancel,
    categories = [],
    initialData = null,
    isLoading = false
}) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        amount: initialData?.amount || '',
        category_id: initialData?.category_id || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
        is_recurring: initialData?.is_recurring || false,
        exclude_from_limit: initialData?.exclude_from_limit || false
    })

    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...formData,
            amount: parseFloat(formData.amount) || 0,
            category_id: formData.category_id || null
        })
    }

    const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.name
    }))

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Expense Name"
                placeholder="e.g., Groceries, Netflix, Rent"
                value={formData.name}
                onChange={handleChange('name')}
                required
            />

            <div className="relative">
                <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange('amount')}
                    required
                />
                <DollarSign className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
            </div>

            <Select
                label="Category"
                options={categoryOptions}
                value={formData.category_id}
                onChange={handleChange('category_id')}
                placeholder="Select a category (optional)"
            />

            <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleChange('date')}
                required
            />

            <label className="flex items-center gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={handleChange('is_recurring')}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                    This is a recurring monthly expense
                </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.exclude_from_limit}
                    onChange={handleChange('exclude_from_limit')}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                    Exclude from weekly limit calculation
                </span>
            </label>

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
                    {initialData ? 'Update' : 'Add Expense'}
                </Button>
            </div>
        </form>
    )
}

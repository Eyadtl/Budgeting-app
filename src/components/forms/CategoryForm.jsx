import { useState } from 'react'
import { Button, Input } from '../ui'
import { Palette, DollarSign } from 'lucide-react'

const colorPresets = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
]

/**
 * Form for adding/editing categories
 */
export function CategoryForm({
    onSubmit,
    onCancel,
    initialData = null,
    isLoading = false
}) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        budget_limit: initialData?.budget_limit || '',
        color_code: initialData?.color_code || colorPresets[0]
    })

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

    const handleColorSelect = (color) => {
        setFormData(prev => ({ ...prev, color_code: color }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...formData,
            budget_limit: parseFloat(formData.budget_limit) || 0
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Category Name"
                placeholder="e.g., Groceries, Entertainment, Utilities"
                value={formData.name}
                onChange={handleChange('name')}
                required
            />

            <div className="relative">
                <Input
                    label="Monthly Budget Limit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.budget_limit}
                    onChange={handleChange('budget_limit')}
                    required
                />
                <DollarSign className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Palette className="w-4 h-4" />
                    Category Color
                </label>
                <div className="flex flex-wrap gap-2">
                    {colorPresets.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => handleColorSelect(color)}
                            className={`
                                w-8 h-8 rounded-full transition-all
                                ${formData.color_code === color
                                    ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                                    : 'hover:scale-110'
                                }
                            `}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

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
                    {initialData ? 'Update' : 'Add Category'}
                </Button>
            </div>
        </form>
    )
}

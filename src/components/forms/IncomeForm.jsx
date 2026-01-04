import { useState } from 'react'
import { Button, Input, Select } from '../ui'
import { DollarSign, Calendar, Repeat } from 'lucide-react'

/**
 * Form for adding/editing income sources
 */
export function IncomeForm({
    onSubmit,
    onCancel,
    initialData = null,
    isLoading = false
}) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        amount: initialData?.amount || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
        frequency: initialData?.frequency || 'one-time'
    })

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...formData,
            amount: parseFloat(formData.amount) || 0
        })
    }

    const frequencyOptions = [
        { value: 'one-time', label: 'One-time' },
        { value: 'recurring', label: 'Recurring (Monthly)' }
    ]

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Income Name"
                placeholder="e.g., Salary, Freelance, Side gig"
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

            <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleChange('date')}
                required
            />

            <Select
                label="Frequency"
                options={frequencyOptions}
                value={formData.frequency}
                onChange={handleChange('frequency')}
            />

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
                    {initialData ? 'Update' : 'Add Income'}
                </Button>
            </div>
        </form>
    )
}

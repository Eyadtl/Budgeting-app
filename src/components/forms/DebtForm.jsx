import { useState } from 'react'
import { Button, Input } from '../ui'
import { DollarSign, Percent } from 'lucide-react'

/**
 * Form for adding/editing debts
 */
export function DebtForm({
    onSubmit,
    onCancel,
    initialData = null,
    isLoading = false
}) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        total_balance: initialData?.total_balance || '',
        amount_paid: initialData?.amount_paid || '0',
        interest_rate: initialData?.interest_rate || ''
    })

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...formData,
            total_balance: parseFloat(formData.total_balance) || 0,
            amount_paid: parseFloat(formData.amount_paid) || 0,
            interest_rate: parseFloat(formData.interest_rate) || 0
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Debt Name"
                placeholder="e.g., Credit Card, Student Loan, Car Loan"
                value={formData.name}
                onChange={handleChange('name')}
                required
            />

            <div className="relative">
                <Input
                    label="Total Balance"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.total_balance}
                    onChange={handleChange('total_balance')}
                    required
                />
                <DollarSign className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
            </div>

            {initialData && (
                <div className="relative">
                    <Input
                        label="Amount Already Paid"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.amount_paid}
                        onChange={handleChange('amount_paid')}
                    />
                    <DollarSign className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
                </div>
            )}

            <div className="relative">
                <Input
                    label="Interest Rate (APR)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    value={formData.interest_rate}
                    onChange={handleChange('interest_rate')}
                />
                <Percent className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
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
                    {initialData ? 'Update' : 'Add Debt'}
                </Button>
            </div>
        </form>
    )
}

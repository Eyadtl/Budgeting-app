import { useState } from 'react'
import { Plus, DollarSign, Repeat, Trash2, Filter } from 'lucide-react'
import { BottomNav, Modal, Button, Card, CardContent } from '../../components'
import { IncomeForm } from '../../components/forms'
import { useProfile, useIncome } from '../../hooks'
import { formatCurrency, formatDate, getMonthName, getCurrentMonth } from '../../utils'

export function Income() {
    const { currencyPreference } = useProfile()
    const {
        currentMonthIncome,
        recurringIncome,
        totalMonthlyIncome,
        addIncome,
        deleteIncome,
        isLoading
    } = useIncome()

    const [showModal, setShowModal] = useState(false)
    const [filter, setFilter] = useState('all') // 'all' | 'recurring' | 'one-time'

    const { month, year } = getCurrentMonth()

    const handleAdd = async (data) => {
        const result = await addIncome(data)
        if (result.success) {
            setShowModal(false)
        }
    }

    const filteredIncome = filter === 'all'
        ? currentMonthIncome
        : filter === 'recurring'
            ? currentMonthIncome.filter(i => i.frequency === 'recurring')
            : currentMonthIncome.filter(i => i.frequency === 'one-time')

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <div className="max-w-lg mx-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Income
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {getMonthName(month)} {year}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Total Card */}
                <Card className="mb-6 bg-gradient-to-br from-green-500 to-emerald-600 border-0">
                    <CardContent className="text-white">
                        <p className="text-sm opacity-80">Total Income This Month</p>
                        <p className="text-3xl font-bold mt-1">
                            {formatCurrency(totalMonthlyIncome, currencyPreference)}
                        </p>
                        <p className="text-sm opacity-80 mt-2">
                            {currentMonthIncome.length} source{currentMonthIncome.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                {/* Filter */}
                <div className="flex gap-2 mb-4">
                    {['all', 'recurring', 'one-time'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                ${filter === f
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }
                            `}
                        >
                            {f === 'all' ? 'All' : f === 'recurring' ? 'Recurring' : 'One-time'}
                        </button>
                    ))}
                </div>

                {/* Income List */}
                {filteredIncome.length > 0 ? (
                    <div className="space-y-2">
                        {filteredIncome.map(income => (
                            <div
                                key={income.id}
                                className="flex items-center gap-4 py-3 px-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-slate-900 dark:text-white truncate">
                                            {income.name}
                                        </h4>
                                        {income.frequency === 'recurring' && (
                                            <Repeat className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatDate(income.date)}
                                    </p>
                                </div>
                                <p className="font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                                    +{formatCurrency(income.amount, currencyPreference)}
                                </p>
                                <button
                                    onClick={() => deleteIncome(income.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No income added yet</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                            Add your first income source
                        </button>
                    </div>
                )}
            </div>

            <BottomNav />

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Add Income"
            >
                <IncomeForm
                    onSubmit={handleAdd}
                    onCancel={() => setShowModal(false)}
                    isLoading={isLoading}
                />
            </Modal>
        </div>
    )
}

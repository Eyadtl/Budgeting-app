import { useState } from 'react'
import { Plus, Receipt, Filter } from 'lucide-react'
import { BottomNav, ExpenseCard, Modal, Card, CardContent, Select } from '../../components'
import { ExpenseForm } from '../../components/forms'
import { useProfile, useCategories, useExpenses } from '../../hooks'
import { formatCurrency, getMonthName, getCurrentMonth } from '../../utils'

export function Expenses() {
    const { currencyPreference } = useProfile()
    const { categories } = useCategories()
    const {
        currentMonthExpenses,
        groupedByCategory,
        totalMonthlyExpenses,
        addExpense,
        deleteExpense,
        isLoading
    } = useExpenses()

    const [showModal, setShowModal] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('')

    const { month, year } = getCurrentMonth()

    const handleAdd = async (data) => {
        const result = await addExpense(data)
        if (result.success) {
            setShowModal(false)
        }
    }

    const handleDelete = async (id) => {
        await deleteExpense(id)
    }

    // Filter by selected category
    const filteredGroups = selectedCategory
        ? groupedByCategory.filter(g => g.categoryId === selectedCategory)
        : groupedByCategory

    const categoryOptions = [
        { value: '', label: 'All Categories' },
        ...categories.map(cat => ({ value: cat.id, label: cat.name }))
    ]

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <div className="max-w-lg mx-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Expenses
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
                <Card className="mb-6 bg-gradient-to-br from-red-500 to-rose-600 border-0">
                    <CardContent className="text-white">
                        <p className="text-sm opacity-80">Total Expenses This Month</p>
                        <p className="text-3xl font-bold mt-1">
                            {formatCurrency(totalMonthlyExpenses, currencyPreference)}
                        </p>
                        <p className="text-sm opacity-80 mt-2">
                            {currentMonthExpenses.length} transaction{currentMonthExpenses.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                {/* Category Filter */}
                {categories.length > 0 && (
                    <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        options={categoryOptions}
                        className="mb-4"
                    />
                )}

                {/* Grouped Expenses */}
                {filteredGroups.length > 0 ? (
                    <div className="space-y-6">
                        {filteredGroups.map(group => (
                            <div key={group.categoryId}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: group.categoryColor }}
                                    />
                                    <h3 className="font-medium text-slate-700 dark:text-slate-300">
                                        {group.categoryName}
                                    </h3>
                                    <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
                                        {formatCurrency(group.total, currencyPreference)}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {group.expenses.map(expense => (
                                        <ExpenseCard
                                            key={expense.id}
                                            expense={expense}
                                            currencyPreference={currencyPreference}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No expenses yet</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                            Add your first expense
                        </button>
                    </div>
                )}
            </div>

            <BottomNav />

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Add Expense"
            >
                <ExpenseForm
                    categories={categories}
                    onSubmit={handleAdd}
                    onCancel={() => setShowModal(false)}
                    isLoading={isLoading}
                />
            </Modal>
        </div>
    )
}

import { useState } from 'react'
import { Plus, Receipt, Download, FileSpreadsheet } from 'lucide-react'
import { BottomNav, ExpenseCard, Modal, Card, CardContent, Select, Button } from '../../components'
import { ExpenseForm } from '../../components/forms'
import { useProfile, useCategories, useExpenses } from '../../hooks'
import {
    formatCurrency,
    getMonthName,
    getCurrentMonth,
    filterByMonth,
    parseDate,
    exportToCSV,
    exportToExcel,
    prepareExpensesForExport
} from '../../utils'

export function Expenses() {
    const { currencyPreference } = useProfile()
    const { categories } = useCategories()
    const {
        expenses,
        addExpense,
        deleteExpense,
        isLoading
    } = useExpenses()

    const [showModal, setShowModal] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('')

    const { month: currentMonth, year: currentYear } = getCurrentMonth()
    const [selectedMonth, setSelectedMonth] = useState(String(currentMonth))
    const [selectedYear, setSelectedYear] = useState(String(currentYear))

    const selectedMonthNumber = Number(selectedMonth)
    const selectedYearNumber = Number(selectedYear)

    const monthOptions = Array.from({ length: 12 }, (_, m) => ({
        value: String(m),
        label: getMonthName(m)
    }))

    const yearOptions = (() => {
        const years = new Set()
        years.add(currentYear)

        for (const expense of expenses) {
            if (!expense?.date) continue
            years.add(parseDate(expense.date).getFullYear())
        }

        return Array.from(years)
            .sort((a, b) => b - a)
            .map((y) => ({ value: String(y), label: String(y) }))
    })()

    const periodExpenses = filterByMonth(expenses, selectedMonthNumber, selectedYearNumber)

    const totalPeriodExpenses = periodExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    // Group expenses by category (for the selected month/year)
    const groupedByCategory = (() => {
        const groups = {}

        periodExpenses.forEach(expense => {
            const categoryId = expense.category_id || 'uncategorized'
            if (!groups[categoryId]) {
                const category = categories.find(c => c.id === categoryId)
                groups[categoryId] = {
                    categoryId,
                    categoryName: category?.name || expense?.categories?.name || 'Uncategorized',
                    categoryColor: category?.color_code || expense?.categories?.color_code || '#94a3b8',
                    expenses: [],
                    total: 0
                }
            }
            groups[categoryId].expenses.push(expense)
            groups[categoryId].total += Number(expense.amount)
        })

        return Object.values(groups).sort((a, b) => b.total - a.total)
    })()

    const handleAdd = async (data) => {
        const result = await addExpense(data)
        if (result.success) {
            setShowModal(false)
            if (result.warning) {
                alert(result.warning)
            }
        } else {
            alert(`Failed to add expense: ${result.error}`)
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

    const filteredExpenses = filteredGroups.flatMap(group => group.expenses)
    const exportFilenameBase = `expenses-${getMonthName(selectedMonthNumber)}-${selectedYearNumber}-${new Date().toISOString().split('T')[0]}`

    const handleExportCSV = () => {
        if (filteredExpenses.length === 0) return
        const data = prepareExpensesForExport({
            expenses: filteredExpenses,
            categories
        })
        exportToCSV(data, exportFilenameBase)
    }

    const handleExportExcel = async () => {
        if (filteredExpenses.length === 0) return
        const data = prepareExpensesForExport({
            expenses: filteredExpenses,
            categories
        })
        await exportToExcel(data, exportFilenameBase, 'Expenses')
    }

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
                            {getMonthName(selectedMonthNumber)} {selectedYearNumber}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Month/Year Selector */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Select
                        label="Month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        options={monthOptions}
                        placeholder={null}
                    />
                    <Select
                        label="Year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        options={yearOptions}
                        placeholder={null}
                    />
                </div>

                {/* Export Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExportExcel}
                        disabled={filteredExpenses.length === 0}
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                        Export Excel
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={filteredExpenses.length === 0}
                    >
                        <Download className="w-4 h-4 mr-1.5" />
                        Export CSV
                    </Button>
                </div>

                {/* Total Card */}
                <Card className="mb-6 bg-gradient-to-br from-red-500 to-rose-600 border-0">
                    <CardContent className="text-white">
                        <p className="text-sm opacity-80">
                            Total Expenses ({getMonthName(selectedMonthNumber)} {selectedYearNumber})
                        </p>
                        <p className="text-3xl font-bold mt-1">
                            {formatCurrency(totalPeriodExpenses, currencyPreference)}
                        </p>
                        <p className="text-sm opacity-80 mt-2">
                            {periodExpenses.length} transaction{periodExpenses.length !== 1 ? 's' : ''}
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

import { useState, useEffect } from 'react'
import { Plus, Download, Receipt, DollarSign, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { HeaderStats, BottomNav, ExpenseCard, Modal, Button } from '../../components'
import { IncomeForm, ExpenseForm } from '../../components/forms'
import { useAuth, useProfile, useIncome, useCategories, useExpenses, useBudgetSummary } from '../../hooks'
import { useBudgetStore } from '../../stores'
import { exportToCSV, prepareTransactionsForExport, isCurrentMonth, getMonthName, getCurrentMonth } from '../../utils'
import { checkMonthRollover, acknowledgeRollover } from '../../utils/rollover'

export function Dashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { currencyPreference } = useProfile()
    const { totalIncome, totalAssigned, remaining, status } = useBudgetSummary()
    const { currentMonthIncome, addIncome, isLoading: incomeLoading } = useIncome()
    const { categories } = useCategories()
    const { currentMonthExpenses, addExpense, deleteExpense, isLoading: expensesLoading } = useExpenses()
    const { fetchAllData } = useBudgetStore()

    const [showIncomeModal, setShowIncomeModal] = useState(false)
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [showRolloverModal, setShowRolloverModal] = useState(false)

    // Load all data on mount
    useEffect(() => {
        if (user?.id) {
            fetchAllData(user.id)
        }
    }, [user?.id, fetchAllData])

    // Check for month rollover
    useEffect(() => {
        const { isNewMonth } = checkMonthRollover()
        if (isNewMonth) {
            setShowRolloverModal(true)
        }
    }, [])

    const { month, year } = getCurrentMonth()

    const handleAddIncome = async (data) => {
        const result = await addIncome(data)
        if (result.success) {
            setShowIncomeModal(false)
        }
    }

    const handleAddExpense = async (data) => {
        const result = await addExpense(data)
        if (result.success) {
            setShowExpenseModal(false)
        }
    }

    const handleExportCSV = () => {
        const data = prepareTransactionsForExport({
            income: currentMonthIncome,
            expenses: currentMonthExpenses,
            categories
        })
        exportToCSV(data, `budget-${getMonthName(month)}-${year}`)
    }

    const handleRolloverAcknowledge = () => {
        acknowledgeRollover()
        setShowRolloverModal(false)
    }

    // Get recent transactions (last 5)
    const recentExpenses = currentMonthExpenses.slice(0, 5)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <div className="max-w-lg mx-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Dashboard
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {getMonthName(month)} {year}
                        </p>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Export to CSV"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>

                {/* Budget Summary */}
                <HeaderStats
                    totalIncome={totalIncome}
                    totalAssigned={totalAssigned}
                    currencyPreference={currencyPreference}
                />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                        onClick={() => setShowIncomeModal(true)}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <DollarSign className="w-5 h-5" />
                        Add Income
                    </button>
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <Receipt className="w-5 h-5" />
                        Add Expense
                    </button>
                </div>

                {/* Status Message */}
                {status === 'under' && totalIncome > 0 && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            💡 You have unassigned funds. Allocate them to categories to reach a zero-based budget.
                        </p>
                        <button
                            onClick={() => navigate('/categories')}
                            className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 hover:underline"
                        >
                            Go to Categories <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {status === 'balanced' && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            ✅ Perfect! Your budget is balanced. Every dollar has a job!
                        </p>
                    </div>
                )}

                {status === 'over' && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-sm text-red-800 dark:text-red-200">
                            ⚠️ You've assigned more than your income. Review your categories to fix this.
                        </p>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Recent Expenses
                        </h2>
                        <button
                            onClick={() => navigate('/expenses')}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            See all
                        </button>
                    </div>

                    {recentExpenses.length > 0 ? (
                        <div className="space-y-2">
                            {recentExpenses.map(expense => (
                                <ExpenseCard
                                    key={expense.id}
                                    expense={expense}
                                    currencyPreference={currencyPreference}
                                    onDelete={deleteExpense}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No expenses yet this month</p>
                            <button
                                onClick={() => setShowExpenseModal(true)}
                                className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                            >
                                Add your first expense
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Add Income Modal */}
            <Modal
                isOpen={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                title="Add Income"
            >
                <IncomeForm
                    onSubmit={handleAddIncome}
                    onCancel={() => setShowIncomeModal(false)}
                    isLoading={incomeLoading}
                />
            </Modal>

            {/* Add Expense Modal */}
            <Modal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                title="Add Expense"
            >
                <ExpenseForm
                    categories={categories}
                    onSubmit={handleAddExpense}
                    onCancel={() => setShowExpenseModal(false)}
                    isLoading={expensesLoading}
                />
            </Modal>

            {/* Rollover Modal */}
            <Modal
                isOpen={showRolloverModal}
                onClose={handleRolloverAcknowledge}
                title="🎉 New Month!"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        Welcome to {getMonthName(month)}! Your budget has been reset for the new month.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                        Recurring income and expenses from last month are ready to be added.
                    </p>
                    <Button onClick={handleRolloverAcknowledge} className="w-full">
                        Got it!
                    </Button>
                </div>
            </Modal>
        </div>
    )
}

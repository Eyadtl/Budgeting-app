import { useState } from 'react'
import { PiggyBank, Plus, Minus, SlidersHorizontal, Trash2 } from 'lucide-react'
import { BottomNav, Modal, Card, CardContent } from '../../components'
import { SavingsTransactionForm, SavingsSetBalanceForm } from '../../components/forms'
import { useProfile, useSavings } from '../../hooks'
import { formatCurrency, formatDate } from '../../utils'

function getTransactionLabel(transaction) {
    switch (transaction?.type) {
        case 'deposit':
            return 'Deposit'
        case 'withdraw':
            return 'Withdraw'
        case 'adjustment':
            return 'Adjustment'
        case 'rollover_transfer':
            return 'Monthly Rollover'
        default:
            return 'Savings'
    }
}

function getTransactionBadgeClasses(transaction) {
    switch (transaction?.type) {
        case 'rollover_transfer':
            return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
        case 'adjustment':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        case 'withdraw':
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        default:
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    }
}

export function Savings() {
    const { currencyPreference } = useProfile()
    const {
        savingsTransactions,
        currentSavingsBalance,
        deposit,
        withdraw,
        setSavingsBalance,
        deleteSavingsTransaction,
        isLoading
    } = useSavings()

    const [modalMode, setModalMode] = useState(null) // 'deposit' | 'withdraw' | 'set' | null
    const [isSubmitting, setIsSubmitting] = useState(false)

    const closeModal = () => {
        setModalMode(null)
        setIsSubmitting(false)
    }

    const handleDeposit = async ({ amount, date, note }) => {
        setIsSubmitting(true)
        const result = await deposit(amount, { date, note })
        setIsSubmitting(false)
        if (result.success) {
            closeModal()
            return
        }
        alert(`Failed to deposit to savings: ${result.error}`)
    }

    const handleWithdraw = async ({ amount, date, note }) => {
        setIsSubmitting(true)
        const result = await withdraw(amount, { date, note })
        setIsSubmitting(false)
        if (result.success) {
            closeModal()
            return
        }
        alert(`Failed to withdraw from savings: ${result.error}`)
    }

    const handleSetBalance = async ({ targetBalance, date, note }) => {
        setIsSubmitting(true)
        const result = await setSavingsBalance(targetBalance, { date, note })
        setIsSubmitting(false)
        if (result.success) {
            closeModal()
            return
        }
        alert(`Failed to set savings balance: ${result.error}`)
    }

    const handleDeleteTransaction = async (id) => {
        const result = await deleteSavingsTransaction(id)
        if (!result.success) {
            alert(`Failed to delete savings transaction: ${result.error}`)
        }
    }

    const openDeposit = () => setModalMode('deposit')
    const openWithdraw = () => setModalMode('withdraw')
    const openSetBalance = () => setModalMode('set')

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <div className="max-w-lg mx-auto p-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Savings
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Track your savings balance and history
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <PiggyBank className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>

                <Card className="mb-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 border-0">
                    <CardContent className="text-white">
                        <p className="text-sm opacity-80">Current Savings Balance</p>
                        <p className="text-3xl font-bold mt-1">
                            {formatCurrency(currentSavingsBalance, currencyPreference)}
                        </p>
                        <p className="text-sm opacity-80 mt-2">
                            {savingsTransactions.length} transaction{savingsTransactions.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                        onClick={openDeposit}
                        className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="text-sm">Deposit</span>
                    </button>
                    <button
                        onClick={openWithdraw}
                        className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <Minus className="w-5 h-5" />
                        <span className="text-sm">Withdraw</span>
                    </button>
                    <button
                        onClick={openSetBalance}
                        className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        <span className="text-sm">Set Balance</span>
                    </button>
                </div>

                <div className="mb-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Savings History
                    </h2>
                </div>

                {savingsTransactions.length > 0 ? (
                    <div className="space-y-2">
                        {savingsTransactions.map((transaction) => {
                            const signedAmount = Number(transaction.signed_amount || 0)
                            const isPositive = signedAmount > 0
                            return (
                                <div
                                    key={transaction.id}
                                    className="flex items-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    <div className={`px-2 py-1 rounded-md text-xs font-medium ${getTransactionBadgeClasses(transaction)}`}>
                                        {getTransactionLabel(transaction)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {transaction.note || 'No note'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatDate(transaction.date)}
                                        </p>
                                    </div>
                                    <p className={`font-semibold text-sm flex-shrink-0 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {isPositive ? '+' : ''}{formatCurrency(signedAmount, currencyPreference)}
                                    </p>
                                    <button
                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                        title="Delete savings transaction"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <PiggyBank className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No savings transactions yet</p>
                        <button
                            onClick={openDeposit}
                            className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                            Add your first savings deposit
                        </button>
                    </div>
                )}
            </div>

            <BottomNav />

            <Modal
                isOpen={modalMode === 'deposit'}
                onClose={closeModal}
                title="Deposit to Savings"
            >
                <SavingsTransactionForm
                    mode="deposit"
                    onSubmit={handleDeposit}
                    onCancel={closeModal}
                    isLoading={isLoading || isSubmitting}
                    currencyPreference={currencyPreference}
                />
            </Modal>

            <Modal
                isOpen={modalMode === 'withdraw'}
                onClose={closeModal}
                title="Withdraw from Savings"
            >
                <SavingsTransactionForm
                    mode="withdraw"
                    onSubmit={handleWithdraw}
                    onCancel={closeModal}
                    isLoading={isLoading || isSubmitting}
                    currencyPreference={currencyPreference}
                    maxAmount={currentSavingsBalance}
                />
            </Modal>

            <Modal
                isOpen={modalMode === 'set'}
                onClose={closeModal}
                title="Set Savings Balance"
            >
                <SavingsSetBalanceForm
                    currentBalance={currentSavingsBalance}
                    onSubmit={handleSetBalance}
                    onCancel={closeModal}
                    isLoading={isLoading || isSubmitting}
                    currencyPreference={currencyPreference}
                />
            </Modal>
        </div>
    )
}


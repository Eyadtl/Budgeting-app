import { useState } from 'react'
import { Plus, CreditCard, ArrowLeft, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DebtCard, Modal, Card, CardContent, Button } from '../../components'
import { DebtForm, PaymentForm } from '../../components/forms'
import { useProfile, useDebts } from '../../hooks'
import { formatCurrency } from '../../utils'

export function Debts() {
    const navigate = useNavigate()
    const { currencyPreference } = useProfile()
    const {
        debts,
        totalBalance,
        totalPaid,
        totalRemaining,
        paidOffCount,
        activeCount,
        addDebt,
        updateDebt,
        recordPayment,
        deleteDebt,
        isLoading
    } = useDebts()

    const [showDebtModal, setShowDebtModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [editingDebt, setEditingDebt] = useState(null)
    const [payingDebt, setPayingDebt] = useState(null)

    const handleAddDebt = async (data) => {
        const result = await addDebt(data)
        if (result.success) {
            setShowDebtModal(false)
        }
    }

    const handleEditDebt = (debt) => {
        setEditingDebt(debt)
        setShowDebtModal(true)
    }

    const handleUpdateDebt = async (data) => {
        const result = await updateDebt(editingDebt.id, data)
        if (result.success) {
            setShowDebtModal(false)
            setEditingDebt(null)
        }
    }

    const handleRecordPayment = (debt) => {
        setPayingDebt(debt)
        setShowPaymentModal(true)
    }

    const handlePaymentSubmit = async (amount) => {
        const result = await recordPayment(payingDebt.id, amount)
        if (result.success) {
            setShowPaymentModal(false)
            setPayingDebt(null)
        }
    }

    const handleDeleteDebt = async (id) => {
        if (confirm('Are you sure you want to delete this debt?')) {
            await deleteDebt(id)
        }
    }

    const handleCloseDebtModal = () => {
        setShowDebtModal(false)
        setEditingDebt(null)
    }

    // Separate active and paid off debts
    const activeDebts = debts.filter(d => d.amount_paid < d.total_balance)
    const paidOffDebts = debts.filter(d => d.amount_paid >= d.total_balance)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-6">
            <div className="max-w-lg mx-auto p-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Debt Tracker
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowDebtModal(true)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary Card */}
                <Card className="mb-6 bg-gradient-to-br from-slate-700 to-slate-900 border-0">
                    <CardContent className="text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingDown className="w-6 h-6 opacity-80" />
                            <span className="text-lg font-semibold">Debt Overview</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs opacity-70">Total Owed</p>
                                <p className="text-lg font-bold">
                                    {formatCurrency(totalBalance, currencyPreference)}
                                </p>
                            </div>
                            <div className="text-center border-x border-white/20">
                                <p className="text-xs opacity-70">Paid Off</p>
                                <p className="text-lg font-bold text-green-400">
                                    {formatCurrency(totalPaid, currencyPreference)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs opacity-70">Remaining</p>
                                <p className="text-lg font-bold">
                                    {formatCurrency(totalRemaining, currencyPreference)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
                            <span className="opacity-70">{activeCount} active</span>
                            <span className="text-green-400">{paidOffCount} paid off</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Debts */}
                {activeDebts.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                            Active Debts
                        </h2>
                        <div className="space-y-3">
                            {activeDebts.map(debt => (
                                <DebtCard
                                    key={debt.id}
                                    debt={debt}
                                    currencyPreference={currencyPreference}
                                    onRecordPayment={handleRecordPayment}
                                    onEdit={handleEditDebt}
                                    onDelete={handleDeleteDebt}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Paid Off Debts */}
                {paidOffDebts.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                            Paid Off 🎉
                        </h2>
                        <div className="space-y-3">
                            {paidOffDebts.map(debt => (
                                <DebtCard
                                    key={debt.id}
                                    debt={debt}
                                    currencyPreference={currencyPreference}
                                    onEdit={handleEditDebt}
                                    onDelete={handleDeleteDebt}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {debts.length === 0 && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No debts tracked yet</p>
                        <p className="text-sm mt-1">Add debts to track your payoff progress</p>
                        <button
                            onClick={() => setShowDebtModal(true)}
                            className="mt-3 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                            Add your first debt
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Debt Modal */}
            <Modal
                isOpen={showDebtModal}
                onClose={handleCloseDebtModal}
                title={editingDebt ? 'Edit Debt' : 'Add Debt'}
            >
                <DebtForm
                    initialData={editingDebt}
                    onSubmit={editingDebt ? handleUpdateDebt : handleAddDebt}
                    onCancel={handleCloseDebtModal}
                    isLoading={isLoading}
                />
            </Modal>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false)
                    setPayingDebt(null)
                }}
                title="Record Payment"
            >
                {payingDebt && (
                    <PaymentForm
                        debt={payingDebt}
                        currencyPreference={currencyPreference}
                        onSubmit={handlePaymentSubmit}
                        onCancel={() => {
                            setShowPaymentModal(false)
                            setPayingDebt(null)
                        }}
                        isLoading={isLoading}
                    />
                )}
            </Modal>
        </div>
    )
}

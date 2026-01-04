import { useState } from 'react'
import { User, LogOut, Settings, CreditCard, DollarSign, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BottomNav, Button, Card, CardContent, Input, Modal, Select } from '../../components'
import { useAuth, useProfile } from '../../hooks'
import { formatCurrency } from '../../utils'

const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'INR', label: 'INR - Indian Rupee' },
]

export function Profile() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { profile, currencyPreference, monthlyIncomeGoal, updateProfile, isLoading } = useProfile()

    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [settings, setSettings] = useState({
        currency_preference: currencyPreference,
        monthly_income_goal: monthlyIncomeGoal
    })

    const handleLogout = async () => {
        await logout()
    }

    const handleSaveSettings = async () => {
        const result = await updateProfile({
            currency_preference: settings.currency_preference,
            monthly_income_goal: parseFloat(settings.monthly_income_goal) || 0
        })
        if (result.success) {
            setShowSettingsModal(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <div className="max-w-lg mx-auto p-4">
                {/* Header */}
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Profile
                </h1>

                {/* User Info Card */}
                <Card className="mb-6">
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {user?.email || 'User'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Currency: {currencyPreference}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card>
                        <CardContent className="text-center py-4">
                            <DollarSign className="w-6 h-6 mx-auto text-indigo-600 dark:text-indigo-400 mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Income Goal</p>
                            <p className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(monthlyIncomeGoal, currencyPreference)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate('/debts')}
                    >
                        <CardContent className="text-center py-4">
                            <CreditCard className="w-6 h-6 mx-auto text-red-500 mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Debt Tracker</p>
                            <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-center gap-1">
                                View <ChevronRight className="w-4 h-4" />
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                    <button
                        onClick={() => {
                            setSettings({
                                currency_preference: currencyPreference,
                                monthly_income_goal: monthlyIncomeGoal
                            })
                            setShowSettingsModal(true)
                        }}
                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">Settings</span>
                        <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                    </button>

                    <button
                        onClick={() => navigate('/debts')}
                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
                    >
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">Manage Debts</span>
                        <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">Sign Out</span>
                    </button>
                </div>
            </div>

            <BottomNav />

            {/* Settings Modal */}
            <Modal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                title="Settings"
            >
                <div className="space-y-4">
                    <Select
                        label="Currency"
                        options={currencies}
                        value={settings.currency_preference}
                        onChange={(e) => setSettings(prev => ({ ...prev, currency_preference: e.target.value }))}
                    />

                    <div className="relative">
                        <Input
                            label="Monthly Income Goal"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={settings.monthly_income_goal}
                            onChange={(e) => setSettings(prev => ({ ...prev, monthly_income_goal: e.target.value }))}
                        />
                        <DollarSign className="absolute right-3 top-9 w-5 h-5 text-slate-400" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setShowSettingsModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveSettings}
                            loading={isLoading}
                            className="flex-1"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

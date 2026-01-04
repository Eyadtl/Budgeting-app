import { useState } from 'react'
import { Plus, Tags } from 'lucide-react'
import { BottomNav, CategoryCard, Modal, Card, CardContent } from '../../components'
import { CategoryForm } from '../../components/forms'
import { useProfile, useCategories } from '../../hooks'
import { formatCurrency, getMonthName, getCurrentMonth } from '../../utils'

export function Categories() {
    const { currencyPreference } = useProfile()
    const {
        categoriesWithSpent,
        totalBudgeted,
        addCategory,
        updateCategory,
        deleteCategory,
        isLoading
    } = useCategories()

    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)

    const { month, year } = getCurrentMonth()

    const handleAdd = async (data) => {
        const result = await addCategory(data)
        if (result.success) {
            setShowModal(false)
        }
    }

    const handleEdit = (category) => {
        setEditingCategory(category)
        setShowModal(true)
    }

    const handleUpdate = async (data) => {
        const result = await updateCategory(editingCategory.id, data)
        if (result.success) {
            setShowModal(false)
            setEditingCategory(null)
        }
    }

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this category?')) {
            await deleteCategory(id)
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingCategory(null)
    }

    // Calculate total spent
    const totalSpent = categoriesWithSpent.reduce((sum, cat) => sum + cat.spent, 0)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <div className="max-w-lg mx-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Categories
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

                {/* Budget Summary Card */}
                <Card className="mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 border-0">
                    <CardContent className="text-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm opacity-80">Total Budgeted</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(totalBudgeted, currencyPreference)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm opacity-80">Total Spent</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(totalSpent, currencyPreference)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Categories Grid */}
                {categoriesWithSpent.length > 0 ? (
                    <div className="grid gap-3">
                        {categoriesWithSpent.map(category => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                spent={category.spent}
                                currencyPreference={currencyPreference}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <Tags className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No categories yet</p>
                        <p className="text-sm mt-1">Create categories to organize your budget</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-3 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                            Add your first category
                        </button>
                    </div>
                )}
            </div>

            <BottomNav />

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingCategory ? 'Edit Category' : 'Add Category'}
            >
                <CategoryForm
                    initialData={editingCategory}
                    onSubmit={editingCategory ? handleUpdate : handleAdd}
                    onCancel={handleCloseModal}
                    isLoading={isLoading}
                />
            </Modal>
        </div>
    )
}

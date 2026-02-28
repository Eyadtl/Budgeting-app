import Papa from 'papaparse'

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format currency value
 * @param {number} value 
 * @param {string} currency 
 * @returns {string}
 */
export function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(value)
}

/**
 * Parse a date input into a Date object.
 * Supabase DATE columns return "YYYY-MM-DD" which `new Date()` treats as UTC,
 * causing off-by-one day issues in many timezones. We parse those as local dates.
 * @param {string|Date} date
 * @returns {Date}
 */
export function parseDate(date) {
    if (date instanceof Date) return date

    if (typeof date === 'string') {
        // Date-only (no time) -> parse as local date
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [y, m, d] = date.split('-').map(Number)
            return new Date(y, m - 1, d)
        }
    }

    return new Date(date)
}

/**
 * Format date to locale string
 * @param {string|Date} date 
 * @returns {string}
 */
export function formatDate(date) {
    return parseDate(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

// ============================================
// Date & Month Utilities
// ============================================

/**
 * Get current month and year
 * @returns {{ month: number, year: number }}
 */
export function getCurrentMonth() {
    const now = new Date()
    return {
        month: now.getMonth(),
        year: now.getFullYear()
    }
}

/**
 * Check if a date is in the current month
 * @param {string|Date} date 
 * @returns {boolean}
 */
export function isCurrentMonth(date) {
    const d = parseDate(date)
    const { month, year } = getCurrentMonth()
    return d.getMonth() === month && d.getFullYear() === year
}

/**
 * Filter items by a specific month
 * @param {Array} items - Items with a 'date' field
 * @param {number} month - 0-indexed month
 * @param {number} year 
 * @returns {Array}
 */
export function filterByMonth(items, month, year) {
    return items.filter(item => {
        const d = parseDate(item.date)
        return d.getMonth() === month && d.getFullYear() === year
    })
}

/**
 * Get month name from month number
 * @param {number} month - 0-indexed month
 * @returns {string}
 */
export function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month]
}

// ============================================
// Budget Calculation Utilities
// ============================================

/**
 * Calculate total spent for a category
 * @param {Array} expenses 
 * @param {string} categoryId 
 * @returns {number}
 */
export function calculateCategorySpent(expenses, categoryId) {
    return expenses
        .filter(exp => exp.category_id === categoryId)
        .reduce((sum, exp) => sum + Number(exp.amount), 0)
}

/**
 * Calculate total from an array of items with amount field
 * @param {Array} items 
 * @returns {number}
 */
export function calculateTotal(items) {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

// ============================================
// Export Utilities
// ============================================

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export function exportToCSV(data, filename = 'export') {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Export data to an Excel workbook
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Worksheet name
 */
export async function exportToExcel(data, filename = 'export', sheetName = 'Sheet1') {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob(
        [excelBuffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' }
    )
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${filename}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Prepare transaction data for CSV export
 * @param {Object} data - { income, expenses, categories }
 * @returns {Array}
 */
export function prepareTransactionsForExport({ income = [], expenses = [], categories = [] }) {
    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.id === categoryId)
        return cat?.name || 'Uncategorized'
    }

    const incomeRows = income.map(item => ({
        Date: formatDate(item.date),
        Type: 'Income',
        Name: item.name,
        Amount: item.amount,
        Category: '-',
        Frequency: item.frequency
    }))

    const expenseRows = expenses.map(item => ({
        Date: formatDate(item.date),
        Type: 'Expense',
        Name: item.name,
        Amount: -item.amount,
        Category: getCategoryName(item.category_id),
        Frequency: item.is_recurring ? 'Recurring' : 'One-time'
    }))

    return [...incomeRows, ...expenseRows].sort((a, b) =>
        new Date(b.Date) - new Date(a.Date)
    )
}

/**
 * Prepare expense data for export
 * @param {Object} data - { expenses, categories }
 * @returns {Array}
 */
export function prepareExpensesForExport({ expenses = [], categories = [] }) {
    const getCategoryName = (categoryId, expenseCategory) => {
        if (expenseCategory?.name) return expenseCategory.name
        const cat = categories.find(c => c.id === categoryId)
        return cat?.name || 'Uncategorized'
    }

    return [...expenses]
        .sort((a, b) => parseDate(b.date) - parseDate(a.date))
        .map(item => ({
            Date: formatDate(item.date),
            Name: item.name,
            Category: getCategoryName(item.category_id, item.categories),
            Amount: Number(item.amount),
            Recurring: item.is_recurring ? 'Yes' : 'No'
        }))
}

// ============================================
// Weekly Limit Utilities
// ============================================
export * from './weeklyLimit'
export * from './weeklyCarryover'


import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, DollarSign, Tags, Receipt, User } from 'lucide-react'

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/income', label: 'Income', icon: DollarSign },
    { path: '/categories', label: 'Categories', icon: Tags },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-50">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {navItems.map(({ path, label, icon: Icon }) => {
                    const isActive = location.pathname === path
                    return (
                        <NavLink
                            key={path}
                            to={path}
                            className={`
                                flex flex-col items-center justify-center
                                w-full h-full
                                transition-all duration-200
                                ${isActive
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }
                            `}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                            <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 w-12 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                            )}
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}

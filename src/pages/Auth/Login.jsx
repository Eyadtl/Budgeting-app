import { useState } from 'react'
import { useAuthStore } from '../../stores'
import { Button, Input, Card, CardContent, CardHeader } from '../../components/ui'

export function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const { login, register, isLoading, error, clearError } = useAuthStore()

    const handleSubmit = async (e) => {
        e.preventDefault()
        clearError()

        if (isSignUp) {
            await register(email, password)
        } else {
            await login(email, password)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className="text-center text-slate-600 dark:text-slate-400 mt-1">
                        {isSignUp
                            ? 'Start your zero-based budgeting journey'
                            : 'Sign in to your budget'}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            loading={isLoading}
                        >
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                clearError()
                            }}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            {isSignUp
                                ? 'Already have an account? Sign in'
                                : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

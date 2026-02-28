-- ============================================
-- Zero-Based Monthly Budgeting App
-- Database Schema for Supabase (PostgreSQL)
-- ============================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

-- Frequency type for income sources
CREATE TYPE income_frequency AS ENUM ('recurring', 'one-time');

-- ============================================
-- TABLES
-- ============================================

-- Profiles table
-- Stores user preferences and settings
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency_preference TEXT DEFAULT 'USD',
    monthly_income_goal NUMERIC(12, 2) DEFAULT 0,
    weekly_limit_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Income Sources table
-- Tracks all income entries (salary, freelance, etc.)
CREATE TABLE income_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    frequency income_frequency NOT NULL DEFAULT 'one-time',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
-- Budget categories for organizing expenses
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    budget_limit NUMERIC(12, 2) NOT NULL CHECK (budget_limit >= 0),
    color_code TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category Budgets table
-- Stores per-month budgeted amounts per category (supports rollover)
CREATE TABLE category_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    budget_month DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, budget_month)
);

-- Expenses table
-- Individual expense entries linked to categories
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    exclude_from_limit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debts table
-- Tracks debts, loans, and payment progress
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_balance NUMERIC(12, 2) NOT NULL CHECK (total_balance >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    interest_rate NUMERIC(5, 2) DEFAULT 0 CHECK (interest_rate >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings Transactions table
-- Tracks savings deposits, withdrawals, adjustments, and month rollover transfers
CREATE TABLE savings_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'adjustment', 'rollover_transfer')),
    signed_amount NUMERIC(12, 2) NOT NULL CHECK (signed_amount <> 0),
    note TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Savings Rollovers table
-- Tracks whether a month-start leftover transfer to savings was accepted or skipped
CREATE TABLE monthly_savings_rollovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rollover_month DATE NOT NULL,
    source_month DATE NOT NULL,
    suggested_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (suggested_amount >= 0),
    accepted_amount NUMERIC(12, 2) CHECK (accepted_amount IS NULL OR accepted_amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'skipped')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, rollover_month)
);

-- Weekly Limit Carryovers table
-- Tracks last-week weekly overspend debt that rolls into the next month
CREATE TABLE weekly_limit_carryovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rollover_month DATE NOT NULL,
    source_month DATE NOT NULL,
    carryover_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (carryover_amount >= 0),
    remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'applied', 'settled')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, rollover_month)
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for faster user-based queries
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX idx_income_sources_date ON income_sources(date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_category_budgets_user_id ON category_budgets(user_id);
CREATE INDEX idx_category_budgets_category_id ON category_budgets(category_id);
CREATE INDEX idx_category_budgets_budget_month ON category_budgets(budget_month);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX idx_savings_transactions_date ON savings_transactions(date);
CREATE INDEX idx_monthly_savings_rollovers_user_id ON monthly_savings_rollovers(user_id);
CREATE INDEX idx_monthly_savings_rollovers_rollover_month ON monthly_savings_rollovers(rollover_month);
CREATE INDEX idx_weekly_limit_carryovers_user_id ON weekly_limit_carryovers(user_id);
CREATE INDEX idx_weekly_limit_carryovers_rollover_month ON weekly_limit_carryovers(rollover_month);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_savings_rollovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_limit_carryovers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Income Sources policies
CREATE POLICY "Users can view their own income sources"
    ON income_sources FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income sources"
    ON income_sources FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income sources"
    ON income_sources FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income sources"
    ON income_sources FOR DELETE
    USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can view their own categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON categories FOR DELETE
    USING (auth.uid() = user_id);

-- Category Budgets policies
CREATE POLICY "Users can view their own category budgets"
    ON category_budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category budgets"
    ON category_budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category budgets"
    ON category_budgets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category budgets"
    ON category_budgets FOR DELETE
    USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view their own expenses"
    ON expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
    ON expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
    ON expenses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
    ON expenses FOR DELETE
    USING (auth.uid() = user_id);

-- Debts policies
CREATE POLICY "Users can view their own debts"
    ON debts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
    ON debts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
    ON debts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
    ON debts FOR DELETE
    USING (auth.uid() = user_id);

-- Savings Transactions policies
CREATE POLICY "Users can view their own savings transactions"
    ON savings_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings transactions"
    ON savings_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings transactions"
    ON savings_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings transactions"
    ON savings_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Monthly Savings Rollovers policies
CREATE POLICY "Users can view their own monthly savings rollovers"
    ON monthly_savings_rollovers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly savings rollovers"
    ON monthly_savings_rollovers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly savings rollovers"
    ON monthly_savings_rollovers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly savings rollovers"
    ON monthly_savings_rollovers FOR DELETE
    USING (auth.uid() = user_id);

-- Weekly Limit Carryovers policies
CREATE POLICY "Users can view their own weekly limit carryovers"
    ON weekly_limit_carryovers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly limit carryovers"
    ON weekly_limit_carryovers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly limit carryovers"
    ON weekly_limit_carryovers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly limit carryovers"
    ON weekly_limit_carryovers FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_sources_updated_at
    BEFORE UPDATE ON income_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_budgets_updated_at
    BEFORE UPDATE ON category_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_transactions_updated_at
    BEFORE UPDATE ON savings_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_savings_rollovers_updated_at
    BEFORE UPDATE ON monthly_savings_rollovers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_limit_carryovers_updated_at
    BEFORE UPDATE ON weekly_limit_carryovers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- OPTIONAL: Function to auto-create profile on signup
-- ============================================

-- This function creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, currency_preference, monthly_income_goal)
    VALUES (NEW.id, 'USD', 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

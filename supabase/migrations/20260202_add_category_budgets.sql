-- Add category_budgets table to support per-month category budgeting (with rollover)

CREATE TABLE IF NOT EXISTS category_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    budget_month DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, budget_month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_category_budgets_user_id ON category_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_category_budgets_category_id ON category_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_category_budgets_budget_month ON category_budgets(budget_month);

-- RLS
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

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

-- updated_at trigger (re-uses shared function if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_category_budgets_updated_at
            BEFORE UPDATE ON category_budgets
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;


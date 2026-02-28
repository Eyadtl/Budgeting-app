-- Add savings tables for transaction ledger and monthly rollover tracking

CREATE TABLE IF NOT EXISTS savings_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'adjustment', 'rollover_transfer')),
    signed_amount NUMERIC(12, 2) NOT NULL CHECK (signed_amount <> 0),
    note TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_savings_rollovers (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_date ON savings_transactions(date);
CREATE INDEX IF NOT EXISTS idx_monthly_savings_rollovers_user_id ON monthly_savings_rollovers(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_savings_rollovers_rollover_month ON monthly_savings_rollovers(rollover_month);

-- RLS
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_savings_rollovers ENABLE ROW LEVEL SECURITY;

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

-- updated_at triggers (re-use shared function if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_savings_transactions_updated_at
            BEFORE UPDATE ON savings_transactions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_monthly_savings_rollovers_updated_at
            BEFORE UPDATE ON monthly_savings_rollovers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;


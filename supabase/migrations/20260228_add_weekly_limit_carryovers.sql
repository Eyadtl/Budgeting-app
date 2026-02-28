-- Add weekly limit carryover tracking for month-to-month weekly overspend debt

CREATE TABLE IF NOT EXISTS weekly_limit_carryovers (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_limit_carryovers_user_id ON weekly_limit_carryovers(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_limit_carryovers_rollover_month ON weekly_limit_carryovers(rollover_month);

-- RLS
ALTER TABLE weekly_limit_carryovers ENABLE ROW LEVEL SECURITY;

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

-- updated_at trigger (re-use shared function if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_weekly_limit_carryovers_updated_at') THEN
        CREATE TRIGGER update_weekly_limit_carryovers_updated_at
            BEFORE UPDATE ON weekly_limit_carryovers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;


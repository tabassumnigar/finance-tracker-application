ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS transfer_account_id BIGINT REFERENCES accounts(id),
    ADD COLUMN IF NOT EXISTS merchant VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255),
    ADD COLUMN IF NOT EXISTS tags TEXT,
    ADD COLUMN IF NOT EXISTS recurring_transaction_id BIGINT REFERENCES recurring_transactions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE transactions
    ALTER COLUMN description TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_account_id ON transactions(transfer_account_id);

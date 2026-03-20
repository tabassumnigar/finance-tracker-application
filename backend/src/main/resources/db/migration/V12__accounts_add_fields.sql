ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

UPDATE accounts
SET opening_balance = balance,
    current_balance = balance,
    last_updated_at = now()
WHERE opening_balance = 0;

ALTER TABLE accounts
    DROP COLUMN IF EXISTS balance;

CREATE TABLE IF NOT EXISTS recurring_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id),
    amount NUMERIC(18,2) NOT NULL,
    description TEXT NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    next_run TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id),
    amount NUMERIC(18,2) NOT NULL,
    description TEXT NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    type VARCHAR(20) NOT NULL
);

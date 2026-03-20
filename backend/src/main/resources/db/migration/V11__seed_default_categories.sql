INSERT INTO users (email, password, display_name, created_at)
VALUES
    ('demo@finance.local', '$2a$10$7qV0pQwI1n60XQ7EGS32CeYbF8KJG3xLejFG9R1Yay0/1I3mZq8Uu', 'Demo User', now())
ON CONFLICT DO NOTHING;

INSERT INTO categories (user_id, name, type)
VALUES
    ((SELECT id FROM users WHERE email = 'demo@finance.local'), 'Income', 'INCOME'),
    ((SELECT id FROM users WHERE email = 'demo@finance.local'), 'Groceries', 'EXPENSE'),
    ((SELECT id FROM users WHERE email = 'demo@finance.local'), 'Entertainment', 'EXPENSE');

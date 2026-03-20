ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT '#60a5fa',
    ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

UPDATE categories
SET color = COALESCE(color, '#60a5fa'),
    is_archived = COALESCE(is_archived, FALSE),
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now());

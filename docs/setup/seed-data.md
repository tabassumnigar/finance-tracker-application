# Seed Data & Sample Imports

Use this guidance when you want a reproducible dataset for demos or QA.

## Default categories
The backend automatically seeds the default income/expense categories after registration via `CategoryService.ensureDefaultCategories`. You do not need to run migrations manually for the defaults; they appear the first time each user registers.

## Sample SQL
`finance_tracker.sql` (root of the repo) contains a small dataset that mirrors the current schema and includes:

- A default user (`demo@finance.app`) with hashed credentials.
- Sample accounts with various balances (`checking`, `savings`, `credit-card`).
- Categories for income and expense.
- A couple of transactions covering income, bill payment, and a transfer.

Import the file into Podman's PostgreSQL instance if you prefer to start with existing data:

```bash
podman exec -i finance-tracker-application_postgres_1 psql -U postgres -d finance_tracker < finance_tracker.sql
```

Adjust the container name to match your `podman compose` setup (use `podman ps` to inspect). After importing, restart the backend so that Hibernate recognizes the new rows.

## Notes
- Because Hibernate is configured with `spring.jpa.hibernate.ddl-auto=update`, the schema updates alongside the entities in `backend/src/main/java/com/finance/tracker/entity`.
- The sample dataset is purely for local testing and can be reset by dropping the `finance_tracker` database or recreating the Podman volume.

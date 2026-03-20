# QA Checklist

Run through the following manual verification steps once the Podman stack (`infra/podman/compose.yaml`) is up to ensure every module behaves as expected.

## 1. Authentication
- [ ] `POST /api/auth/register` with valid user data creates a user, seeds default categories, and returns JWT/refresh tokens.
- [ ] Login with `POST /api/auth/login` accepts normalized email (trim + lower) and returns tokens.
- [ ] Refresh flow (`POST /api/auth/refresh`) issues new tokens and invalidates old refresh tokens.
- [ ] Forgot/reset password endpoints respond (placeholder message) even if email does not exist.
- [ ] Frontend login/register forms validate inputs, render server errors via inline feedback, and respect `aria-live` announcements.

## 2. Accounts
- [ ] `GET /api/accounts` returns only the current user's accounts.
- [ ] Create/update endpoints validate `openingBalance >= 0` and account type.
- [ ] Transfer funds rejects zero/negative amounts, same account, and insufficient balance; updates both accounts atomically.
- [ ] Frontend accounts page shows loading/empty/error states, responds to create/edit/transfer modals, and invalidates queries on success.

## 3. Categories
- [ ] CRUD operations enforce unique names per user/type and scope by user.
- [ ] Archiving soft-deletes when transactions exist, and deletion otherwise.
- [ ] Frontend categories page groups income vs expense, surfaces validation errors, and shows empty state CTA.

## 4. Transactions
- [ ] List endpoint supports paging/filters and always scoping by the authenticated user.
- [ ] Create/edit/delete update account balances correctly, enforce required fields, and prevent negative amounts.
- [ ] Transfers create entries for both accounts and keep balances consistent.
- [ ] Frontend transactions page renders table/list, filter bar, pagination, and modals with Recharts placeholders where relevant.

## 5. Dashboard
- [ ] Summary, charts, recent transactions, savings goal, and upcoming recurring endpoints return aggregated data.
- [ ] Dashboard UI displays skeletons/loading states, empty messaging, and CTA buttons for actions (add transaction, create budget, etc.).

## 6. Budgets
- [ ] Budgets CRUD respects month/year/category combos, enforces positive amount, and returns progress/alert levels.
- [ ] Duplicate-last-month endpoint copies prior values for the selected month.
- [ ] Frontend budgets page shows cards with progress bars, threshold badges, and toasts for create/update/delete/duplicate.

## 7. Goals
- [ ] Creating/updating goals updates status/progress; contributions/withdrawals adjust balances and enforce linked account limits.
- [ ] Frontend goals page shows cards with progress bars, toasts, and modals for contributions/withdrawals.

## 8. Recurring Transactions
- [ ] Recurring CRUD manages frequency, next run, and pause state; scheduler (if running) triggers additional transactions with linkage.
- [ ] UI lists recurring items, allows add/edit/delete/pause, and shows upcoming dates.

## 9. Reports
- [ ] All report endpoints respect filters (`startDate`, `endDate`, `accountId`, `categoryId`, `transactionType`) and return empty arrays when no data exists.
- [ ] CSV export endpoint returns `text/plain` with `Content-Disposition`, and the frontend export button downloads the file with toast feedback.
- [ ] Reports page charts render correctly and surface loading/empty/error states per widget.

## 10. Infrastructure/Environment
- [ ] `podman compose -f infra/podman/compose.yaml up --build` finishes without errors; `podman compose ... down` tears down the stack.
- [ ] PostgreSQL data persists in `postgres-data` volume; inspect `finance_tracker` schema via `psql` or pgAdmin.
- [ ] The `.env` example is up-to-date and used by both backend/frontend services.

Verify each checkbox (or document the remaining blockers) before handing off or demoing the project.

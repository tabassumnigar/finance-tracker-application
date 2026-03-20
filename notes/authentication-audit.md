# Authentication Audit Notes

Date: 2026-03-19

Scope:
- Backend auth endpoints: register, login, refresh, forgot-password, reset-password
- Supporting security/auth components
- Frontend auth service, interceptor, store, protected routing, and logout flow

Confirmed:
- Register, login, and refresh shared the same token response contract across backend and frontend.
- Registration already seeded default categories before returning auth tokens.
- Frontend cleared auth safely when refresh failed.

Issues found:
- Email validation was incomplete on auth DTOs.
- Forgot/reset password endpoints returned placeholder success responses without doing the work.
- Logout only cleared client state; refresh tokens stayed active server-side.
- Unauthorized response handling was not explicitly pinned for the frontend refresh interceptor.
- JWT secret configuration still used a checked-in fallback.

Implementation direction:
- Tighten request validation.
- Add refresh-token logout revocation.
- Add password-reset token persistence and reset workflow.
- Make password-reset responses truthful and non-placeholder, with reset-token exposure for local non-email flows.
- Make backend unauthorized responses explicit for the frontend retry contract.

Implemented:
- Added strict auth DTO validation for register, login, and forgot-password email fields.
- Added `/api/auth/logout` with refresh-token revocation.
- Added password reset token persistence and reset workflow.
- Added local non-email reset support by exposing reset tokens in forgot-password responses.
- Updated frontend auth service and auth pages to use the new logout and reset contracts.
- Updated security configuration to return explicit `401` responses for unauthenticated protected requests.
- Removed the checked-in JWT secret fallback and switched to env-based configuration.

Validation:
- Backend: `mvn test` passed after auth and follow-up integration fixes.
- Frontend: `npm run build` passed.

Current auth status:
- Completed and build-validated.

Follow-up fixes:
- Resolved a backend startup failure caused by stale compiled classes in `backend/target` still referencing an old `User.accounts -> mappedBy = "user"` relationship after the account ownership refactor. A clean rebuild removed the stale metadata.
- Hardened frontend auth navigation by making login and register redirects state-driven. `LoginPage` now redirects to `/dashboard` when an access token exists, and `RegisterPage` now redirects to `/onboarding` when auth state is present.

Follow-up validation:
- Backend: `mvn clean test` passed and cleared stale entity metadata.
- Frontend: `npm run build` passed after the redirect fix.

---

# Accounts Module Notes

Date: 2026-03-19

Scope:
- Backend account endpoints: list, detail, create, update, transfer
- Account ownership and user-scoping
- Frontend account pages, hooks, types, and transfer flow
- Account balance correctness relative to the transaction ledger

Issues found:
- The accounts module had schema drift across backend/frontend: mixed UUID, string, and number ID assumptions.
- Account transfer logic updated balances directly without creating a transaction record.
- Account updates could overwrite `currentBalance` even when transaction history already existed.
- The accounts page displayed a fake combined USD total for mixed-currency accounts.

Implemented:
- Normalized account IDs to numeric types across backend and frontend.
- Aligned account ownership to the active auth model by resolving the current authenticated user through the security context.
- Restored the accounts page as a real exported module and fixed its form/type integration.
- Changed account transfers to create ledger-backed `TRANSFER` transactions instead of mutating balances directly.
- Blocked direct balance overwrites once an account has transaction history; balance changes should come from the ledger.
- Updated the accounts summary UI to group totals by currency instead of mixing balances into a fake USD total.

Validation:
- Backend: `mvn test` passed after the accounts fixes.
- Frontend: `npm run build` passed after the accounts fixes.

Current accounts status:
- Completed and build-validated.

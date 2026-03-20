# Backend

This Spring Boot module will expose REST APIs for all finance features. Package base is `com.finance.tracker`.

## Developer notes
- Controllers live under `src/main/java/com/finance/tracker/controller`.
- Services, repositories, mappers, and entities mirror feature areas listed in the root README.
- Configuration, security, and scheduler helpers are centralized for reuse.
- Database migrations live in `src/main/resources/db/migration` (Flyway friendly).

Populate this README with run/build instructions once the modules exist.

## Local startup requirement
- Set `APP_JWT_SECRET` before starting the app. It must be at least 32 bytes long or the backend will fail during `JwtService` initialization.
- Example PowerShell session:

```powershell
$env:APP_JWT_SECRET="change_this_to_a_long_secret_change_this_12345"
mvn spring-boot:run
```

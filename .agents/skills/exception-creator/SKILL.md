---
name: exception-creator
description: >-
  Guides creating new HTTP and domain exceptions in ProxyGuard adhering to Aegis framework standards.
  Use this skill whenever creating global HTTP exceptions or feature-scoped domain exceptions with custom error codes.
---

# Exception Creator Skill

This skill enforces ProxyGuard's two-tier exception architecture rooted in the in-house **Aegis** framework (`#aegis/http`).

---

## The Two Tiers of Exceptions

```text
Are you adding an exception?
  │
  ├── Is it a generic/common HTTP error shared across features (400, 401, 403, 404, 409, 500, etc.)?
  │     └── YES ➔ Place in `src/exceptions/<name>.exception.ts`
  │               Export in `src/exceptions/index.ts`
  │               Extends: `Exception` from `#aegis/http`
  │               Error code: Standard `ERR_<HTTP_STATUS>` (e.g. `ERR_BAD_REQUEST`, `ERR_CONFLICT`)
  │
  └── Is it a feature-specific domain error with a dedicated error code (e.g. ERR_TOKEN_EXPIRED, ERR_POOL_EXHAUSTED)?
        └── YES ➔ Place in `src/features/<feature>/exceptions/<name>.exception.ts`
                  Export in `src/features/<feature>/exceptions/index.ts` (if multiple)
                  Extends: `Exception` from `#aegis/http`
                  Error code: Domain-specific `ERR_<FEATURE_ACTION/STATE>` (e.g. `ERR_TOKEN_EXPIRED`)
```

---

## Strict Exception Rules

1. **Mandatory Aegis Base Class**:
   - Every exception MUST extend `Exception` from `#aegis/http` (`import { Exception } from '#aegis/http';`).
   - Call `super(errorCode, statusCode, message)`:
     - `errorCode` (string): Screaming snake case identifier starting with `ERR_` (e.g. `ERR_TOKEN_EXPIRED`).
     - `statusCode` (number): Always use `HttpStatusCode` from `axios` (e.g. `HttpStatusCode.Unauthorized`, `HttpStatusCode.NotFound`). Never use raw numeric literals.
     - `message` (string | undefined): Optional descriptive message or default error message.

2. **File & Class Naming Conventions**:
   - File Name: `<name>.exception.ts` (kebab-case, e.g. `token-expired.exception.ts`, `not-found.exception.ts`).
   - Class Name: `<Name>Exception` (PascalCase, e.g. `TokenExpiredException`, `NotFoundException`).

3. **Placement & Scoping**:
   - **Global HTTP Exceptions**: Stored directly in `src/exceptions/`. Must be re-exported in `src/exceptions/index.ts`.
   - **Feature-Scoped Exceptions**: Stored in `src/features/<feature>/exceptions/`. If multiple exceptions exist in that feature, re-export them from `src/features/<feature>/exceptions/index.ts`.
   - Never put feature-specific exceptions into `src/exceptions/`.
   - Never put generic HTTP exceptions into `src/features/<feature>/exceptions/`.

4. **Service Integration**:
   - Single-action services (`<action>-<feature>.service.ts`) throw these exceptions when validation or domain constraints fail:
     ```typescript
     if (isExpired) {
       throw new TokenExpiredException('API key token has expired');
     }
     ```
   - Controllers do not catch and convert domain exceptions manually; exceptions bubble up or are handled consistently with their `statusCode` and `errorCode`.

---

## Reference Templates

See [templates.md](./references/templates.md) for boilerplate implementations.

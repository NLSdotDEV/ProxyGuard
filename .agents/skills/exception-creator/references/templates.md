# Exception Templates & Patterns

## 1. Feature-Scoped Domain Exception Template

When a feature requires its own business exception with a custom error code:

File: `src/features/<feature>/exceptions/<name>.exception.ts`

```typescript
import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class TokenExpiredException extends Exception {
  constructor(message: string = 'The provided token has expired') {
    super('ERR_TOKEN_EXPIRED', HttpStatusCode.Unauthorized, message);
  }
}
```

Optional Feature Exception Barrel Export: `src/features/<feature>/exceptions/index.ts`

```typescript
export * from './token-expired.exception.js';
export * from './invalid-token.exception.js';
```

---

## 2. Global Common HTTP Exception Template

When adding a reusable standard HTTP exception:

File: `src/exceptions/<name>.exception.ts`

```typescript
import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class ConflictException extends Exception {
  constructor(message?: string) {
    super('ERR_CONFLICT', HttpStatusCode.Conflict, message);
  }
}
```

Global Re-export in `src/exceptions/index.ts`:

```typescript
export * from './conflict.exception.js';
```

---

## 3. Usage Example in a Single-Action Service

File: `src/features/api-key/services/validate-token.service.ts`

```typescript
import { TokenExpiredException } from '../exceptions/token-expired.exception.js';

export class ValidateTokenService {
  async handle(dto: ValidateTokenDto): Promise<TokenValidationResult> {
    const key = await this.findKey(dto.token);
    if (!key) {
      throw new TokenExpiredException('API key token is not valid or expired');
    }

    return { valid: true };
  }
}
```

import { randomBytes } from 'node:crypto';
import { ApiKey } from '../../../database/entities/ApiKey.js';
import { em } from '../../../database/db.js';
import * as argon2 from 'argon2';

export interface RequestApiKeyResult {
  readonly id: string;
  readonly secret: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class RequestApiKeyService {
  /**
   * Handles the request to generate and persist a new API key.
   */
  async handle(): Promise<RequestApiKeyResult> {
    const plainTextSecret = randomBytes(32).toString('hex');
    const hashedSecret = await argon2.hash(plainTextSecret);
    const apiKey = em.create(ApiKey, {
      secret: hashedSecret,
    });

    await em.flush();

    return {
      id: apiKey.id,
      secret: plainTextSecret,
      createdAt: apiKey.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: apiKey.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

export default new RequestApiKeyService();

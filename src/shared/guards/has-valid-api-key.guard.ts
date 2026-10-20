import { FastifyRequest } from 'fastify';
import { ForbiddenException } from '../../exceptions/forbidden.exception.js';
import { em } from '../../database/db.js';
import { ApiKey } from '../../database/entities/index.js';
import * as argon2 from 'argon2';
import { InternalServerErrorException } from '../../exceptions/internal-server-error.exception.js';

export async function HasValidApiKeyGuard(request: FastifyRequest) {
  const headers = request.headers;

  const apiKeyId = headers['api-key-id']?.toString();
  const apiSecret = headers['api-key-secret']?.toString();

  if (!apiKeyId || !apiSecret) {
    throw new ForbiddenException('invalid api key or secret header provided');
  }

  const apiKey = await em.findOne(ApiKey, {
    id: apiKeyId,
  });

  if (!apiKey) {
    throw new ForbiddenException('invalid api key or secret');
  }

  let hasValidSecret = false;
  try {
    hasValidSecret = await argon2.verify(apiKey.secret, apiSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    throw new InternalServerErrorException(message);
  }

  if (!hasValidSecret) {
    throw new ForbiddenException('invalid api key or secret');
  }
}

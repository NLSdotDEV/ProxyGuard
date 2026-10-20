import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller } from '#aegis/http';
import requestApiKeyService, {
  RequestApiKeyService,
} from './services/request-api-key.service.js';
import { HttpStatusCode } from 'axios';

export class ApiKeyController extends Controller {
  constructor(private readonly requestApiKeyService: RequestApiKeyService) {
    super();
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await this.requestApiKeyService.handle();
    reply.status(HttpStatusCode.Created).send(result);
  }
}

export default new ApiKeyController(requestApiKeyService);

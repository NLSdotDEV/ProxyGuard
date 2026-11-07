import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller } from '#aegis/http';
import requestApiKeyService, {
  RequestApiKeyService,
} from './services/request-api-key.service.js';
import { HttpStatusCode } from 'axios';
import { RequestApiKeySchemaType } from './api-key.schema.js';

export class ApiKeyController extends Controller {
  constructor(private readonly requestApiKeyService: RequestApiKeyService) {
    super();
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { name } = request.body as RequestApiKeySchemaType;
    const result = await this.requestApiKeyService.handle(name);
    reply.status(HttpStatusCode.Created).send(result);
  }
}

export default new ApiKeyController(requestApiKeyService);

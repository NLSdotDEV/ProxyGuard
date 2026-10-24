import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller } from '#aegis/http';
import { HttpStatusCode } from 'axios';
import leaseProxyService, {
  LeaseProxyService,
} from './services/lease-proxy.service.js';
import refreshProxyLeaseService, {
  RefreshProxyLeaseService,
} from './services/refresh-proxy-lease.service.js';
import updateProxyService, {
  UpdateProxyService,
} from './services/update-proxy.service.js';
import {
  LeaseProxySchemaType,
  RefreshProxyLeaseSchemaType,
  UpdateProxySchemaType,
} from './proxy.schema.js';

export class ProxyController extends Controller {
  constructor(
    private readonly leaseProxyService: LeaseProxyService,
    private readonly refreshProxyLeaseService: RefreshProxyLeaseService,
    private readonly updateProxyService: UpdateProxyService,
  ) {
    super();
  }

  async lease(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = (request.body ?? {}) as LeaseProxySchemaType;
    const apiKeyId = request.headers['api-key-id']?.toString() ?? '';
    const response = await this.leaseProxyService.handle({
      ...body,
      apiKeyId,
    });
    reply.status(HttpStatusCode.Ok).send(response);
  }

  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as RefreshProxyLeaseSchemaType;
    const apiKeyId = request.headers['api-key-id']?.toString() ?? '';
    const response = await this.refreshProxyLeaseService.handle({
      ...body,
      apiKeyId,
    });
    reply.status(HttpStatusCode.Ok).send(response);
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as UpdateProxySchemaType;
    const apiKeyId = request.headers['api-key-id']?.toString() ?? '';
    const response = await this.updateProxyService.handle({
      ...body,
      apiKeyId,
    });
    reply.status(HttpStatusCode.Accepted).send(response);
  }
}

export default new ProxyController(
  leaseProxyService,
  refreshProxyLeaseService,
  updateProxyService,
);

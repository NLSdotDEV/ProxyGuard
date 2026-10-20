import { Controller } from '#aegis/http';
import { FastifyReply, FastifyRequest } from 'fastify';
import { HttpStatusCode } from 'axios';
import loadProxyScrapeSubAccountsService, {
  LoadProxyScrapeSubAccountsService,
} from './services/load-proxy-scrape-subaccounts.service.js';
import { LoadProxyScrapeSubAccountsType } from './proxy-scrape.schema.js';

export class ProxyScrapeController extends Controller {
  constructor(
    private readonly loadProxyScrapeSubAccountsService: LoadProxyScrapeSubAccountsService,
  ) {
    super();
  }

  async loadSubAccounts(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const body = request.body as LoadProxyScrapeSubAccountsType;
    const response = await this.loadProxyScrapeSubAccountsService.handle(body);
    reply.status(HttpStatusCode.Ok).send(response);
  }
}

export default new ProxyScrapeController(loadProxyScrapeSubAccountsService);

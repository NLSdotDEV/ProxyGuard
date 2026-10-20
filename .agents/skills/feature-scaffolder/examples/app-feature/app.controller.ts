import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller } from '#aegis/http';
import { HttpStatusCode } from 'axios';
import getHelloService, {
  GetHelloService,
} from './services/get-hello.service.js';
import findAppService, { FindAppService } from './services/find-app.service.js';
import { GetHelloSchemaType } from './app.schema.js';

export class AppController extends Controller {
  constructor(
    private readonly getHelloService: GetHelloService,
    private readonly findAppService: FindAppService,
  ) {
    super();
  }

  // 1:1 mapped to routes, zero business logic
  async getHello(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as GetHelloSchemaType;
    const response = await this.getHelloService.handle(body);
    reply.status(HttpStatusCode.Ok).send(response);
  }

  // Standard CRUD naming: findAll
  async findAll(_request: FastifyRequest, reply: FastifyReply) {
    const response = await this.findAppService.findAll();
    reply.status(HttpStatusCode.Ok).send(response);
  }
}

export default new AppController(getHelloService, findAppService);

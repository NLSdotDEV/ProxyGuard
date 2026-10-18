import { FastifyReply, FastifyRequest } from 'fastify';
import appService, { AppService } from './services/app.service.js';
import { GetHelloSchemaType } from './app.schema.js';
import { Controller } from '../../shared/controllers/controller.js';

export class AppController extends Controller {
  constructor(private readonly appService: AppService) {
    super();
  }

  async getHello(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as GetHelloSchemaType;
    const response = this.appService.getHello(body);
    reply.status(200).send(response);
  }
}

export default new AppController(appService);

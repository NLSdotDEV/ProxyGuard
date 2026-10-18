import { FastifyReply, FastifyRequest } from "fastify";
import appService, { AppService } from "./services/app.service.js";
import { GetHelloSchemaType } from "./app.schema.js";

export class AppController {
    constructor(
        private readonly appService: AppService
    ) { }
    async getHello(request: FastifyRequest, reply: FastifyReply) {
        const body = request.body as GetHelloSchemaType;
        const response = this.appService.getHello(body);
        reply.status(200).send(response);
    }

}

export default new AppController(appService);
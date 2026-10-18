import { FastifyInstance, FastifyPluginAsync } from "fastify";


// define routes
const routes: FastifyPluginAsync = async (fastify, opts) => { };


export class Router {
    static async define(instance: FastifyInstance) {
        const v1 = "v1";
        const currentVersion = v1;
        instance.register(routes, { prefix: `api/${currentVersion}` });
    }
}
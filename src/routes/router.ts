import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { AppRoutes } from "../features/app/app.routes.js";


// define routes
const routes: FastifyPluginAsync = async (fastify, opts) => {
    fastify.register(AppRoutes, { prefix: "app" })
};


export class Router {
    static async define(instance: FastifyInstance) {
        const v1 = "v1";
        const currentVersion = v1;
        instance.register(routes, { prefix: `api/${currentVersion}` });
    }
}
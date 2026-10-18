import { FastifyInstance } from "fastify";
import { Router } from "../routes/router.js";

export async function boostrap(server: FastifyInstance) {
    await Router.define(server);
}
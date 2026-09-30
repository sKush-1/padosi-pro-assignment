import { FastifyInstance } from "fastify";
import { getProfile, updateProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/middleware.auth";

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/profile", { preHandler: authMiddleware }, getProfile);
  fastify.patch("/profile", { preHandler: authMiddleware }, updateProfile);
}

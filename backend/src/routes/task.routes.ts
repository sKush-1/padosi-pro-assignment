import { FastifyInstance } from "fastify";
import {
  listTasks,
  listCategories,
  selectTasks,
  getMyTasks,
} from "../controllers/task.controller";
import { authMiddleware } from "../middlewares/middleware.auth";

export async function taskRoutes(fastify: FastifyInstance): Promise<void> {
  // Public: view the catalogue
  fastify.get("/", listTasks);
  fastify.get("/categories", listCategories);

  // Protected: user-specific task selection
  fastify.post("/select", { preHandler: authMiddleware }, selectTasks);
  fastify.get("/my-tasks", { preHandler: authMiddleware }, getMyTasks);
}

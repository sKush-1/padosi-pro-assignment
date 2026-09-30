import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { testConnection } from "./config/database/db.test";
import { authRoutes } from "./routes/auth.routes";
import { userRoutes } from "./routes/user.routes";
import { taskRoutes } from "./routes/task.routes";
import fastifyCookie from "@fastify/cookie";
import logger from "./utils/logger";

const server: FastifyInstance = Fastify({
  logger: true,
});

interface HelloResponse {
  hello: string;
}

server.get<{ Reply: HelloResponse }>("/", async (_request, _reply) => {
  return { hello: "padosi-pro api v1" };
});

const api_version = "/api/v1";

async function connectDB() {
  const isConnected = await testConnection();

  if (isConnected) {
    logger.info("Database connected successfully!");
    return;
  }

  logger.error("failed to connect db");
  process.exit(1);
}

connectDB();

const start = async () => {
  try {
    await server.register(cors, {
      origin: process.env.CORS || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    });

    await server.register(fastifyCookie, {
      secret: process.env.COOKIE_SECRET,
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      await server.close();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      await server.close();
      process.exit(0);
    });

    await server.register(authRoutes, {
      prefix: `${api_version}/auth`,
    });

    await server.register(userRoutes, {
      prefix: `${api_version}/user`,
    });

    await server.register(taskRoutes, {
      prefix: `${api_version}/tasks`,
    });

    await server.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

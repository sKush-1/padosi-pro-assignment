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
      origin: (origin, cb) => {
        // 1. Allow native mobile apps (Android/iOS fetch), Postman, cURL (no Origin header)
        if (!origin) {
          return cb(null, true);
        }

        // 2. Configured origins (web, dev servers, tunnels)
        const allowedOrigins = [
          "http://localhost:3000",
          "http://localhost:8081", // Expo Web / Metro default port
          "http://localhost:19006",
          process.env.CORS,
          process.env.CORS_ORIGIN,
        ].filter(Boolean);

        // 3. Allow matching origins, local IPs (Android emulator/LAN), or dev tunnels
        const isAllowed =
          allowedOrigins.includes(origin) ||
          origin.includes("localhost") ||
          origin.startsWith("http://127.0.0.1") ||
          origin.startsWith("http://10.0.2.2") ||
          origin.startsWith("http://192.168.") ||
          origin.endsWith(".trycloudflare.com") ||
          origin.endsWith(".ngrok-free.app") ||
          origin.endsWith(".ngrok.io");

        if (isAllowed) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
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

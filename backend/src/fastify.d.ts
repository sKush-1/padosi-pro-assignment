// Extend Fastify's request type with `user_id` set by auth middleware
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user_id: string;
  }
}

import { FastifyReply } from "fastify";

export function sendResponse<T = any>(
  reply: FastifyReply,
  status: number,
  error: boolean,
  message: string,
  data: T = {} as T,
) {
  return reply.status(status).send({
    error: error,
    message: message,
    data: data,
  });
}

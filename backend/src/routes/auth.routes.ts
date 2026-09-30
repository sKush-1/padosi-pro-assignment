import { FastifyInstance } from "fastify";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  refreshAccessToken,
  me,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/middleware.auth";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/register", register);

  fastify.post("/verify-otp", verifyOtp);

  fastify.post("/resend-otp", resendOtp);

  // Returning users
  fastify.post("/login", login);
  fastify.post("/logout", logout);
  fastify.get("/refresh", refreshAccessToken);

  // Protected
  fastify.get("/me", { preHandler: authMiddleware }, me);
}

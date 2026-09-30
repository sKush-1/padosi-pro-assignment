import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";
import { sendResponse } from "../utils/sendresponse.util";
import { verifyAccessToken } from "../utils/jwt.util";
import { user_access_token_payload } from "../interfaces/users";

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const accessToken = request.cookies.accessToken as string;

  if (!accessToken) {
    return sendResponse(reply, 401, false, "access token missing.");
  }

  try {
    const decoded = verifyAccessToken(accessToken) as user_access_token_payload;
    request.user_id = decoded.user_id;

  } catch (error) {
    console.log(error);
    return sendResponse(reply, 403, false, "Invalid or expired access token.");
  }
};

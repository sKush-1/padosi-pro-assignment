import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { sendResponse } from '../utils/sendresponse.util';
import { verifyAccessToken } from '../utils/jwt.util';
import { user_access_token_payload } from '../interfaces/users';

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // Accept token from cookie (web) OR Authorization: Bearer header (mobile)
  const cookieToken = request.cookies.accessToken as string | undefined;
  const headerAuth = request.headers.authorization;
  const bearerToken =
    headerAuth && headerAuth.startsWith('Bearer ')
      ? headerAuth.slice(7)
      : undefined;

  const token = cookieToken || bearerToken;

  if (!token) {
    return sendResponse(reply, 401, false, 'Access token missing.');
  }

  try {
    const decoded = verifyAccessToken(token) as user_access_token_payload;
    request.user_id = decoded.user_id;
  } catch {
    return sendResponse(reply, 403, false, 'Invalid or expired access token.');
  }
};

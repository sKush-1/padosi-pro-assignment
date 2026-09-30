import jwt from "jsonwebtoken";
import { user_access_token_payload } from "../interfaces/users";

export function createUserAccessToken(
  userAccessTokenPayload: user_access_token_payload,
): string {
  const { user_id } = userAccessTokenPayload;


  const jwtSecret = process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
  const jwtExpiry = process.env.JWT_ACCESSTOKEN_EXPIRY;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  if (!jwtExpiry) {
    throw new Error(
      "JWT_ACCESSTOKEN_EXPIRY environment variable is not defined",
    );
  }

  const accessToken = jwt.sign({ user_id }, jwtSecret, {
    expiresIn: jwtExpiry,
  } as jwt.SignOptions);
  return accessToken as string;
}

export function createUserRefreshToken(
  userAccessTokenPayload: user_access_token_payload,
): string {
  const { user_id } = userAccessTokenPayload;

  const jwtSecretKey = process.env.JWT_REFRESH_TOKEN_SECRET_KEY;
  const jwtRefreshExpiry = process.env.JWT_REFRESHTOKEN_EXPIRY;

  if (!jwtSecretKey) {
    throw new Error(
      "JWT_ACCESS_REFRESH_SECRET_KEY environment variable is not defined",
    );
  }

  if (!jwtRefreshExpiry) {
    throw new Error(
      "JWT_REFRESHTOKEN_EXPIRY environment variable is not defined",
    );
  }

  const refreshToken = jwt.sign({ user_id }, jwtSecretKey, {
    expiresIn: jwtRefreshExpiry,
  } as jwt.SignOptions);
  return refreshToken as string;
}

export function verifyAccessToken(token: string): user_access_token_payload {
  const secret = process.env.JWT_ACCESS_TOKEN_SECRET_KEY;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  try {
    return jwt.verify(token, secret) as user_access_token_payload;
  } catch (error) {
    throw new Error("Access token expired or invalid");
  }
}

export function verifyRefreshToken(token: string): user_access_token_payload {
  const secret = process.env.JWT_REFRESH_TOKEN_SECRET_KEY;

  if (!secret) {
    throw new Error("JWT_REFRESH_TOKEN_SECRET_KEY is not defined");
  }

  try {
    return jwt.verify(token, secret) as user_access_token_payload;
  } catch (error) {
    throw new Error("Refresh token expired or invalid");
  }
}

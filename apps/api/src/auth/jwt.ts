import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me");
const issuer = process.env.JWT_ISSUER ?? "oruclass-api";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export async function signAccessToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<{ userId: string; email: string }> {
  const { payload } = await jwtVerify(token, secret, { issuer });
  return { userId: payload.userId as string, email: payload.email as string };
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, secret, { issuer });
  return { userId: payload.userId as string };
}

export function getRefreshTokenExpiryDate(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "fekm_session";

export type SessionPayload = {
  sub: string; // userId
  email: string;
  role: "USER" | "ADMIN";
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export function isSecureCookie() {
  return process.env.NODE_ENV === "production";
}

export async function signSession(payload: SessionPayload, days = 7) {
  const exp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(getSecretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const p = payload as any;
    if (!p?.sub || !p?.email || !p?.role) return null;
    return { sub: String(p.sub), email: String(p.email), role: p.role };
  } catch {
    return null;
  }
}

export function makeSessionCookie(token: string) {
  const maxAge = 7 * 24 * 60 * 60;
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (isSecureCookie()) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie() {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isSecureCookie()) parts.push("Secure");
  return parts.join("; ");
}

export function getCookieFromHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith(name + "=")) return c.slice(name.length + 1);
  }
  return null;
}

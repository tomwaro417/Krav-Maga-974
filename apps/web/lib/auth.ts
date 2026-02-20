import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, getCookieFromHeader, verifySession } from "@/lib/session";

export type AuthUser = { id: string; email: string; role: "USER" | "ADMIN" };

export async function getAuthUserOrNull(req: Request): Promise<AuthUser | null> {
  const token = getCookieFromHeader(req.headers.get("cookie"), SESSION_COOKIE_NAME);
  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  // Option: recharger le user en base (pour vérifier suppression / rôle)
  const user = await prisma.user.findFirst({
    where: { id: session.sub, email: session.email, deletedAt: null },
    select: { id: true, email: true, role: true }
  });
  if (!user) return null;

  return { id: user.id, email: user.email, role: user.role };
}

export async function requireUser(req: Request): Promise<AuthUser> {
  const u = await getAuthUserOrNull(req);
  if (!u) throw new Response("Unauthorized", { status: 401 });
  return u;
}

export async function requireAdmin(req: Request): Promise<AuthUser> {
  const u = await requireUser(req);
  if (u.role !== "ADMIN") throw new Response("Forbidden", { status: 403 });
  return u;
}

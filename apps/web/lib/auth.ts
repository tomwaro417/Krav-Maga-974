import { prisma } from "@/lib/db";

export type AuthUser = { id: string; email: string; role: "USER" | "ADMIN" };

export async function getAuthUserOrNull(req: Request): Promise<AuthUser | null> {
  // ⚠️ MVP stub: remplace par Clerk/Auth0/NextAuth.
  const email = req.headers.get("x-user-email");
  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email } });
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

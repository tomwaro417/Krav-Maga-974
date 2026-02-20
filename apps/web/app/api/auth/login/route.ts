import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authLoginSchema } from "@/lib/schemas";
import { signSession, makeSessionCookie } from "@/lib/session";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`login:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = authLoginSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, password } = parsed.data;

  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const token = await signSession({ sub: user.id, email: user.email, role: user.role });
  return new Response(JSON.stringify({ ok: true, user: { id: user.id, email: user.email, role: user.role } }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": makeSessionCookie(token)
    }
  });
}

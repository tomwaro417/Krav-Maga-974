import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authRegisterSchema } from "@/lib/schemas";
import { signSession, makeSessionCookie } from "@/lib/session";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = authRegisterSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existing) return Response.json({ error: "Email already in use" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: "USER" },
    select: { id: true, email: true, role: true }
  });

  const token = await signSession({ sub: user.id, email: user.email, role: user.role });
  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": makeSessionCookie(token)
    }
  });
}

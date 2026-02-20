import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function getServerUserOrNull() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;

  const user = await prisma.user.findFirst({
    where: { id: session.sub, deletedAt: null },
    select: { id: true, email: true, role: true }
  });
  return user;
}

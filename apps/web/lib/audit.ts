import { prisma } from "@/lib/db";

export async function logAdminAction(actorId: string, action: string, meta?: any) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        meta: meta ?? null
      }
    });
  } catch {
    // éviter de casser l'action admin si le log échoue
  }
}

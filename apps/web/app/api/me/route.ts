import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { clearSessionCookie } from "@/lib/session";

// Type pour la transaction
interface TransactionClient {
  userTechniqueVideo: typeof prisma.userTechniqueVideo;
  userTechniqueProgress: typeof prisma.userTechniqueProgress;
  userPreference: typeof prisma.userPreference;
  userTechniqueView: typeof prisma.userTechniqueView;
  user: typeof prisma.user;
}

export async function DELETE(req: Request) {
  const user = await requireUser(req);

  const now = new Date();
  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.userTechniqueVideo.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false, deletedAt: now }
    });
    await tx.userTechniqueProgress.deleteMany({ where: { userId: user.id } });
    await tx.userPreference.deleteMany({ where: { userId: user.id } });
    await tx.userTechniqueView.deleteMany({ where: { userId: user.id } });

    await tx.user.update({
      where: { id: user.id },
      data: {
        deletedAt: now,
        email: `deleted_${user.id}@example.invalid`,
        passwordHash: "deleted",
        role: "USER"
      }
    });
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": clearSessionCookie()
    }
  });
}

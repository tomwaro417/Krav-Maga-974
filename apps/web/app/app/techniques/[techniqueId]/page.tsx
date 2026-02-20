import { prisma } from "@/lib/db";
import TechniqueClient from "./technique-client";

export default async function TechniquePage({ params }: { params: { techniqueId: string } }) {
  const t = await prisma.technique.findFirst({
    where: { id: params.techniqueId, isActive: true, module: { isActive: true, belt: { isActive: true } } },
    include: { module: { include: { belt: true } } }
  });
  if (!t) return <div>Introuvable</div>;

  return <TechniqueClient techniqueId={t.id} title={t.title} beltName={t.module.belt.name} moduleTitle={t.module.title} description={t.descriptionRich ?? ""} />;
}

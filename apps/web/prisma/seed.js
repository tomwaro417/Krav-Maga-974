const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Comptes demo (à changer en prod)
  const adminPassword = await bcrypt.hash("admin123!", 10);
  const userPassword = await bcrypt.hash("demo123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN", passwordHash: adminPassword, deletedAt: null },
    create: { email: "admin@example.com", role: "ADMIN", passwordHash: adminPassword },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: { role: "USER", passwordHash: userPassword, deletedAt: null },
    create: { email: "demo@example.com", role: "USER", passwordHash: userPassword },
  });

  // Belts (structure FEKM)
  const belts = [
    { code: "JAUNE", name: "Jaune", orderIndex: 1 },
    { code: "ORANGE", name: "Orange", orderIndex: 2 },
    { code: "VERTE", name: "Verte", orderIndex: 3 },
    { code: "BLEUE", name: "Bleue", orderIndex: 4 },
    { code: "MARRON", name: "Marron", orderIndex: 5 },
    { code: "NOIRE_1_DARGA", name: "Noire 1ère Darga", orderIndex: 6 },
  ];

  for (const b of belts) {
    await prisma.belt.upsert({
      where: { code: b.code },
      update: { name: b.name, orderIndex: b.orderIndex, isActive: true },
      create: { ...b, isActive: true },
    });
  }

  // Petit référentiel d'exemple (si tu n'importes pas tout de suite)
  const yellow = await prisma.belt.findUnique({ where: { code: "JAUNE" }});
  await prisma.module.deleteMany({ where: { beltId: yellow.id } });

  const mod = await prisma.module.create({
    data: {
      beltId: yellow.id,
      title: "UV1 — Techniques en position neutre (extrait)",
      orderIndex: 1,
      isActive: true,
      techniques: {
        create: [
          { title: "Coup de tête", orderIndex: 1, descriptionRich: "Description à compléter.", isActive: true },
          { title: "Coup direct (poing/paume/en pique)", orderIndex: 2, descriptionRich: "Description à compléter.", isActive: true },
          { title: "Crochet", orderIndex: 3, descriptionRich: "Description à compléter.", isActive: true }
        ]
      }
    },
    include: { techniques: true }
  });

  // Exemple de progression : demo user connaît la 2e technique
  await prisma.userTechniqueProgress.upsert({
    where: { userId_techniqueId: { userId: user.id, techniqueId: mod.techniques[1].id } },
    update: { mastery: "KNOWN" },
    create: { userId: user.id, techniqueId: mod.techniques[1].id, mastery: "KNOWN" }
  });

  // Contenu ceinture (placeholder) : à importer depuis le contenu fourni (livre)
  await prisma.beltContent.upsert({
    where: { beltId: yellow.id },
    update: {
      contentRich: "## Contenu ceinture Jaune\n\nÀ importer depuis le contenu fourni par le client.",
      sourceRef: "Livre (contenu fourni)",
      updatedBy: "seed"
    },
    create: {
      beltId: yellow.id,
      contentRich: "## Contenu ceinture Jaune\n\nÀ importer depuis le contenu fourni par le client.",
      sourceRef: "Livre (contenu fourni)",
      updatedBy: "seed"
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

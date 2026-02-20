import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { masteryEnum } from "@/lib/schemas";

export async function GET(req: Request) {
  const user = await requireUser(req);
  const url = new URL(req.url);

  const beltId = url.searchParams.get("beltId");
  const moduleId = url.searchParams.get("moduleId");
  const mastery = url.searchParams.get("mastery"); // NOT_SEEN|SEEN|KNOWN

  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(10, Number(url.searchParams.get("pageSize") || "20")));
  const offset = (page - 1) * pageSize;

  const allowed = mastery ? masteryEnum.safeParse(mastery) : null;
  if (mastery && !allowed?.success) return Response.json({ error: "Invalid mastery" }, { status: 400 });
  if (mastery === "MASTERED") return Response.json({ items: [], page, pageSize, total: 0 });

  // Raw SQL pour gérer NOT_SEEN = (pas de ligne) OU (mastery NOT_SEEN)
  const params: any[] = [user.id];
  let where = "";
  if (moduleId) { params.push(moduleId); where += ` AND t."moduleId" = $${params.length}`; }
  if (beltId) { params.push(beltId); where += ` AND m."beltId" = $${params.length}`; }

  if (!mastery) {
    // default: NOT_SEEN/SEEN/KNOWN + absents
    where += ` AND (p."mastery" IS NULL OR p."mastery" <> 'MASTERED')`;
  } else if (mastery === "NOT_SEEN") {
    where += ` AND (p."mastery" IS NULL OR p."mastery" = 'NOT_SEEN')`;
  } else {
    params.push(mastery);
    where += ` AND p."mastery" = $${params.length}`;
  }

  const totalRows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint as count
     FROM "Technique" t
     JOIN "Module" m ON m.id = t."moduleId"
     LEFT JOIN "UserTechniqueProgress" p
       ON p."techniqueId" = t.id AND p."userId" = $1
     WHERE t."isActive" = true AND m."isActive" = true ${where}`,
    ...params
  );
  const total = Number(totalRows[0]?.count || 0);

  params.push(pageSize);
  params.push(offset);

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
       t.id as "techniqueId",
       t.title as "techniqueTitle",
       COALESCE(p."mastery", 'NOT_SEEN') as "mastery",
       m.id as "moduleId",
       m.title as "moduleTitle",
       b.id as "beltId",
       b.code as "beltCode",
       b.name as "beltName"
     FROM "Technique" t
     JOIN "Module" m ON m.id = t."moduleId"
     JOIN "Belt" b ON b.id = m."beltId"
     LEFT JOIN "UserTechniqueProgress" p
       ON p."techniqueId" = t.id AND p."userId" = $1
     WHERE t."isActive" = true AND m."isActive" = true ${where}
     ORDER BY
       CASE COALESCE(p."mastery", 'NOT_SEEN')
         WHEN 'NOT_SEEN' THEN 1
         WHEN 'SEEN' THEN 2
         WHEN 'KNOWN' THEN 3
         WHEN 'MASTERED' THEN 4
         ELSE 5
       END,
       b."orderIndex" ASC,
       m."orderIndex" ASC,
       t."orderIndex" ASC
     LIMIT $${params.length-1} OFFSET $${params.length}`,
    ...params
  );

  return Response.json({
    page,
    pageSize,
    total,
    items: rows.map(r => ({
      mastery: r.mastery,
      technique: { id: r.techniqueId, title: r.techniqueTitle },
      module: { id: r.moduleId, title: r.moduleTitle },
      belt: { id: r.beltId, code: r.beltCode, name: r.beltName }
    }))
  });
}

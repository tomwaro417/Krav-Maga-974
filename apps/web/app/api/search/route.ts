import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

async function runQuery(sql: string, params: unknown[]) {
  return await prisma.$queryRawUnsafe<unknown[]>(sql, ...params);
}

interface SearchRow {
  id: string;
  title: string;
  mastery: string;
  moduleId: string;
  moduleTitle: string;
  beltId: string;
  beltCode: string;
  beltName: string;
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  const url = new URL(req.url);

  const q = (url.searchParams.get("q") ?? "").trim();
  const beltId = url.searchParams.get("beltId");
  const moduleId = url.searchParams.get("moduleId");
  const mastery = url.searchParams.get("mastery"); // optionnel

  if (!q && !beltId) return Response.json({ results: [] });

  const params: unknown[] = [user.id];
  let where = `WHERE t."isActive" = true AND m."isActive" = true AND b."isActive" = true`;
  if (moduleId) { params.push(moduleId); where += ` AND m.id = $${params.length}`; }
  if (beltId) { params.push(beltId); where += ` AND b.id = $${params.length}`; }

  let likeParamIndex = -1;
  if (q) {
    params.push(`%${q}%`);
    likeParamIndex = params.length;
    where += ` AND (t.title ILIKE $${likeParamIndex} OR COALESCE(t.keywords,'') ILIKE $${likeParamIndex})`;
  }

  if (mastery) {
    if (mastery === "NOT_SEEN") {
      where += ` AND (p.mastery IS NULL OR p.mastery = 'NOT_SEEN')`;
    } else {
      params.push(mastery);
      where += ` AND p.mastery = $${params.length}`;
    }
  }

  const limit = 50;
  const baseSelect = `SELECT
       t.id as "id",
       t.title as "title",
       COALESCE(p.mastery, 'NOT_SEEN') as "mastery",
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
     ${where}`;

  // Tentative avec pg_trgm similarity() si dispo
  let rows: unknown[];
  try {
    const orderBy = q
      ? `ORDER BY similarity(t.title, $${likeParamIndex}) DESC, b."orderIndex" ASC, m."orderIndex" ASC, t."orderIndex" ASC`
      : `ORDER BY b."orderIndex" ASC, m."orderIndex" ASC, t."orderIndex" ASC`;

    rows = await runQuery(`${baseSelect} ${orderBy} LIMIT ${limit}`, params);
  } catch {
    const orderBy = `ORDER BY b."orderIndex" ASC, m."orderIndex" ASC, t."orderIndex" ASC`;
    rows = await runQuery(`${baseSelect} ${orderBy} LIMIT ${limit}`, params);
  }

  const results = (rows as SearchRow[]).map((r: SearchRow) => ({
    id: r.id,
    title: r.title,
    mastery: r.mastery,
    belt: { id: r.beltId, code: r.beltCode, name: r.beltName },
    module: { id: r.moduleId, title: r.moduleTitle }
  }));

  return Response.json({ results });
}

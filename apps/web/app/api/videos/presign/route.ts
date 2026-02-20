import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const schema = z.object({
  purpose: z.enum(["COACH", "USER_BEGINNER", "USER_PROGRESS"]),
  techniqueId: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive()
});

function getS3() {
  const region = process.env.S3_REGION || "eu-west-3";
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const accessKeyId = process.env.S3_ACCESS_KEY || "";
  const secretAccessKey = process.env.S3_SECRET_KEY || "";

  if (!process.env.S3_BUCKET) return null;

  return new S3Client({
    region,
    endpoint,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    forcePathStyle: !!endpoint // utile pour MinIO
  });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });


  if (parsed.data.purpose === "COACH" && user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const maxSizeMb = Number(process.env.VIDEO_MAX_SIZE_MB || "250");
  if (parsed.data.size > maxSizeMb * 1024 * 1024) {
    return Response.json({ error: `File too large (max ${maxSizeMb}MB)` }, { status: 413 });
  }

  const storageKey = `uploads/${user.id}/${crypto.randomUUID()}`;
  const asset = await prisma.videoAsset.create({
    data: {
      provider: "S3",
      storageKey,
      status: "PROCESSING",
      format: parsed.data.contentType,
      size: parsed.data.size,
      createdByUserId: user.id
    }
  });

  const s3 = getS3();
  if (!s3) {
    // On renvoie quand même l'asset pour permettre un mode “mock”
    return Response.json({ assetId: asset.id, uploadUrl: null, storageKey, note: "S3 not configured" });
  }

  const bucket = process.env.S3_BUCKET!;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: parsed.data.contentType
  });

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });
  return Response.json({ assetId: asset.id, uploadUrl, storageKey });
}

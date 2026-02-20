import { getAuthUserOrNull } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAuthUserOrNull(req);
  return Response.json({ user });
}

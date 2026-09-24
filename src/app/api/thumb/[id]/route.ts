import fs from "node:fs";
import path from "node:path";
import { THUMBS_DIR } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const safe = id.replace(/\D/g, "");
  if (!safe) return new Response("Not found", { status: 404 });

  const file = path.join(THUMBS_DIR, `${safe}.jpg`);
  if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });

  const data = new Uint8Array(fs.readFileSync(file));
  return new Response(data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
